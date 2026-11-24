import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase, isSupabaseConfigured, SUPABASE_TABLE } from '../lib/supabase';
import { INITIAL_CARGOS } from '../data/initialData';

const CargosContext = createContext(null);

const STORAGE_KEY = 'concursor_cargos_v1';
const HISTORY_KEY = 'concursor_history_v1';
const BROADCAST_CHANNEL_NAME = 'concursor_live_channel';

export function CargosProvider({ children }) {
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [undoStack, setUndoStack] = useState(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      return storedHistory ? JSON.parse(storedHistory) : [];
    } catch {
      return [];
    }
  });
  const [lastUpdatedId, setLastUpdatedId] = useState(null);
  const [lastUpdateNotice, setLastUpdateNotice] = useState(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [sessionUser, setSessionUser] = useState(() => {
    try {
      const saved = localStorage.getItem('concursor_admin_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const broadcastRef = useRef(null);
  const usingSupabase = isSupabaseConfigured();

  // 1. Inicializar BroadcastChannel para sincronizar pestañas en modo local
  useEffect(() => {
    try {
      broadcastRef.current = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      broadcastRef.current.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'CARGOS_UPDATE') {
          setCargos(payload.cargos);
          setLastUpdatedId(payload.updatedId);
          setLastUpdateNotice(payload.notice);
        } else if (type === 'CARGOS_BATCH') {
          setCargos(payload.cargos);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel aviso:', e);
    }

    return () => {
      if (broadcastRef.current) {
        broadcastRef.current.close();
      }
    };
  }, []);

  // 2. Cargar cargos iniciales y suscribirse a Supabase o localStorage
  useEffect(() => {
    let subscription = null;

    function cargarDatosLocales() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setCargos(JSON.parse(stored));
        } else {
          setCargos(INITIAL_CARGOS);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CARGOS));
        }
        setIsRealtimeConnected(true);
      } catch (e) {
        console.warn('Acceso a localStorage:', e);
        setCargos(INITIAL_CARGOS);
      }
    }

    function handleSupabaseChange(payload) {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      setCargos((prev) => {
        let updatedList;
        if (eventType === 'INSERT') {
          updatedList = [...prev.filter(c => c.id !== newRecord.id), newRecord];
        } else if (eventType === 'UPDATE') {
          updatedList = prev.map(c => (c.id === newRecord.id ? newRecord : c));
        } else if (eventType === 'DELETE') {
          updatedList = prev.filter(c => c.id !== oldRecord.id);
        } else {
          updatedList = prev;
        }
        return updatedList.sort((a, b) => Number(a.orden) - Number(b.orden));
      });

      if (newRecord?.id) {
        setLastUpdatedId(newRecord.id);
        setLastUpdateNotice({
          orden: newRecord.orden,
          nombre: newRecord.nombre,
          estado: newRecord.estado,
          timestamp: Date.now()
        });
      }
    }

    async function initCargos() {
      setLoading(true);
      setError(null);

      if (usingSupabase && supabase) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user) {
            setSessionUser(sessionData.session.user);
          }

          const { data, error: sbError } = await supabase
            .from(SUPABASE_TABLE)
            .select('*')
            .order('orden', { ascending: true });

          if (sbError) {
            console.error('Error al consultar Supabase:', sbError);
            cargarDatosLocales();
          } else if (data && data.length > 0) {
            setCargos(data);
            setIsRealtimeConnected(true);
          } else {
            const { error: insertError } = await supabase
              .from(SUPABASE_TABLE)
              .insert(INITIAL_CARGOS);
            
            if (!insertError) {
              setCargos(INITIAL_CARGOS);
              setIsRealtimeConnected(true);
            } else {
              cargarDatosLocales();
            }
          }

          subscription = supabase
            .channel('cargos-realtime')
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: SUPABASE_TABLE },
              (payload) => {
                handleSupabaseChange(payload);
              }
            )
            .subscribe((status) => {
              setIsRealtimeConnected(status === 'SUBSCRIBED');
            });

        } catch (err) {
          console.error('Fallo Supabase, usando local:', err);
          cargarDatosLocales();
        }
      } else {
        cargarDatosLocales();
      }

      setLoading(false);
    }

    initCargos();

    if (usingSupabase && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setSessionUser(session?.user || null);
      });

      return () => {
        if (subscription) supabase.removeChannel(subscription);
        if (authListener?.subscription) authListener.subscription.unsubscribe();
      };
    }
  }, [usingSupabase]);

  // Guardar local y emitir broadcast
  const persistirLocal = (nuevosCargos, updatedCargoId = null, notice = null) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevosCargos));
      if (broadcastRef.current) {
        broadcastRef.current.postMessage({
          type: 'CARGOS_UPDATE',
          payload: {
            cargos: nuevosCargos,
            updatedId: updatedCargoId,
            notice
          }
        });
      }
    } catch (e) {
      console.warn('Error localStorage:', e);
    }
  };

  const updateCargo = useCallback(async (cargoId, updateData) => {
    let previousState = null;
    let targetOrden = null;

    setCargos((currentList) => {
      const current = currentList.find(c => c.id === cargoId);
      if (current) {
        previousState = { ...current };
        targetOrden = current.orden;
      }
      return currentList;
    });

    if (!previousState) return false;

    const mergedCargo = {
      ...previousState,
      ...updateData,
      updated_at: new Date().toISOString()
    };

    const undoItem = {
      id: `undo-${Date.now()}`,
      cargoId,
      orden: targetOrden,
      cargoNombre: previousState.nombre,
      previousData: previousState,
      newData: mergedCargo,
      timestamp: Date.now(),
      description: `Orden ${targetOrden}: ${previousState.estado} ➔ ${mergedCargo.estado}`
    };

    const newUndoStack = [undoItem, ...undoStack.slice(0, 49)];
    setUndoStack(newUndoStack);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newUndoStack));
    } catch {
      // Ignorar error de cuota
    }

    setCargos((prev) => {
      const updated = prev.map(c => c.id === cargoId ? mergedCargo : c);
      persistirLocal(updated, cargoId, {
        orden: targetOrden,
        nombre: mergedCargo.nombre,
        estado: mergedCargo.estado,
        timestamp: Date.now()
      });
      return updated;
    });

    setLastUpdatedId(cargoId);
    setLastUpdateNotice({
      orden: targetOrden,
      nombre: mergedCargo.nombre,
      estado: mergedCargo.estado,
      timestamp: Date.now()
    });

    if (usingSupabase && supabase) {
      try {
        await supabase
          .from(SUPABASE_TABLE)
          .update(mergedCargo)
          .eq('id', cargoId);
      } catch (err) {
        console.error('Fallo de red Supabase:', err);
      }
    }

    return true;
  }, [undoStack, usingSupabase]);

  const undoLastAction = useCallback(async () => {
    if (undoStack.length === 0) return false;

    const [lastAction, ...remainingStack] = undoStack;
    const { cargoId, previousData, orden } = lastAction;

    setUndoStack(remainingStack);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(remainingStack));
    } catch {
      // Ignorar error de cuota
    }

    setCargos((prev) => {
      const restored = prev.map(c => c.id === cargoId ? previousData : c);
      persistirLocal(restored, cargoId, {
        orden,
        nombre: previousData.nombre,
        estado: previousData.estado,
        restored: true,
        timestamp: Date.now()
      });
      return restored;
    });

    setLastUpdatedId(cargoId);
    setLastUpdateNotice({
      orden,
      nombre: previousData.nombre,
      estado: previousData.estado,
      restored: true,
      timestamp: Date.now()
    });

    if (usingSupabase && supabase) {
      try {
        await supabase
          .from(SUPABASE_TABLE)
          .update(previousData)
          .eq('id', cargoId);
      } catch (err) {
        console.error('Error revertir Supabase:', err);
      }
    }

    return lastAction;
  }, [undoStack, usingSupabase]);

  const batchSaveCargos = useCallback(async (newCargosList) => {
    setCargos(newCargosList);
    persistirLocal(newCargosList);

    if (usingSupabase && supabase) {
      try {
        await supabase
          .from(SUPABASE_TABLE)
          .upsert(newCargosList, { onConflict: 'orden' });
      } catch (err) {
        console.error('Fallo batch Supabase:', err);
      }
    }

    return true;
  }, [usingSupabase]);

  const resetToOfficial = useCallback(async () => {
    setCargos(INITIAL_CARGOS);
    setUndoStack([]);
    persistirLocal(INITIAL_CARGOS);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // Ignorar
    }

    if (usingSupabase && supabase) {
      try {
        await supabase.from(SUPABASE_TABLE).delete().neq('orden', -1);
        await supabase.from(SUPABASE_TABLE).insert(INITIAL_CARGOS);
      } catch (err) {
        console.error('Error resetear Supabase:', err);
      }
    }
  }, [usingSupabase]);

  const loginAdmin = async (email, password) => {
    if (usingSupabase && supabase) {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (authErr) throw authErr;
      setSessionUser(data.user);
      return data.user;
    } else {
      if (email && password) {
        const mockUser = { email, id: 'admin-local-session', role: 'admin' };
        setSessionUser(mockUser);
        try {
          localStorage.setItem('concursor_admin_session', JSON.stringify(mockUser));
        } catch {
          // Ignorar
        }
        return mockUser;
      }
      throw new Error('Email y contraseña requeridos');
    }
  };

  const logoutAdmin = async () => {
    if (usingSupabase && supabase) {
      await supabase.auth.signOut();
    }
    setSessionUser(null);
    try {
      localStorage.removeItem('concursor_admin_session');
    } catch {
      // Ignorar
    }
  };

  const stats = useMemo(() => {
    const total = cargos.length;
    let disponibles = 0;
    let asignadas = 0;
    let reservadas = 0;
    let noHabilitadas = 0;

    for (const c of cargos) {
      if (c.estado === 'disponible') disponibles++;
      else if (c.estado === 'asignada') asignadas++;
      else if (c.estado === 'reservada') reservadas++;
      else if (c.estado === 'no_habilitada') noHabilitadas++;
    }

    return {
      total,
      disponibles,
      asignadas,
      reservadas,
      noHabilitadas,
      habilitadasTotal: total - noHabilitadas
    };
  }, [cargos]);

  const value = {
    cargos,
    loading,
    error,
    stats,
    undoStack,
    lastUpdatedId,
    lastUpdateNotice,
    isRealtimeConnected,
    usingSupabase,
    sessionUser,
    updateCargo,
    undoLastAction,
    batchSaveCargos,
    resetToOfficial,
    loginAdmin,
    logoutAdmin
  };

  return (
    <CargosContext.Provider value={value}>
      {children}
    </CargosContext.Provider>
  );
}

export function useCargos() {
  const context = useContext(CargosContext);
  if (!context) {
    throw new Error('useCargos debe ser usado dentro de un CargosProvider');
  }
  return context;
}
