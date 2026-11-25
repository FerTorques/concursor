import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase, isSupabaseConfigured, SUPABASE_TABLE } from '../lib/supabase';
import { INITIAL_CARGOS } from '../data/initialData';

const CargosContext = createContext(null);

const STORAGE_KEY = 'concursor_cargos_v1';
const HISTORY_KEY = 'concursor_history_v1';
const CONCURSO_STORAGE_KEY = 'concursor_active_concurso';
const BROADCAST_CHANNEL_NAME = 'concursor_live_channel';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CARGO_DB_FIELDS = [
  'orden',
  'region',
  'nombre',
  'bp',
  'cat',
  'mod',
  'zona',
  'jornada',
  'localidad',
  'origen',
  'estado',
  'concurso_asignacion',
  'titular_nombre',
  'titular_dni',
  'titular_puntaje',
  'titular_fecha',
  'reserva_nombre',
  'reserva_dni',
  'reserva_puntaje',
  'reserva_fecha',
  'etiqueta_normativa',
  'observaciones',
  'updated_at',
  'updated_by'
];

const sortByOrden = (list) =>
  [...list].sort((a, b) => Number(a.orden) - Number(b.orden));

const toSupabasePayload = (cargo, { includeValidUuid = false } = {}) => {
  const payload = {};
  if (includeValidUuid && typeof cargo.id === 'string' && UUID_REGEX.test(cargo.id)) {
    payload.id = cargo.id;
  }
  for (const field of CARGO_DB_FIELDS) {
    if (cargo[field] !== undefined) {
      payload[field] = cargo[field];
    }
  }
  if (payload.orden !== undefined) {
    payload.orden = Number(payload.orden);
  }
  return payload;
};

export function CargosProvider({ children }) {
  const usingSupabase = isSupabaseConfigured();
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
    if (isSupabaseConfigured()) return null;
    try {
      const saved = localStorage.getItem('concursor_admin_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Concurso activo de operación para el Administrador ('traslado' | 'ingreso')
  // 1. Traslado Definitivo: hasta el 50% de las vacantes, no admite reservas.
  // 2. Ingreso a la Docencia: vacantes restantes, admite reservas solo de cargos asignados en ingreso.
  const [activeConcurso, setActiveConcursoState] = useState(() => {
    try {
      const saved = localStorage.getItem(CONCURSO_STORAGE_KEY);
      return saved === 'ingreso' ? 'ingreso' : 'traslado';
    } catch {
      return 'traslado';
    }
  });

  const setActiveConcurso = useCallback(async (nuevoConcurso) => {
    if (nuevoConcurso !== 'traslado' && nuevoConcurso !== 'ingreso') return;
    setActiveConcursoState(nuevoConcurso);
    try {
      localStorage.setItem(CONCURSO_STORAGE_KEY, nuevoConcurso);
      if (broadcastRef.current) {
        broadcastRef.current.postMessage({
          type: 'CONCURSO_SWITCH',
          payload: { activeConcurso: nuevoConcurso }
        });
      }
    } catch (e) {
      console.warn('Error al guardar concurso activo:', e);
    }

    if (usingSupabase && supabase) {
      try {
        await supabase
          .from('concurso_config')
          .upsert(
            { key: 'active_concurso', value: nuevoConcurso, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          );
      } catch (e) {
        console.warn('No se pudo sincronizar concurso activo en Supabase:', e);
      }
    }
  }, [usingSupabase]);

  const broadcastRef = useRef(null);
  const cargosRef = useRef([]);

  useEffect(() => {
    cargosRef.current = cargos;
  }, [cargos]);

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
        } else if (type === 'CONCURSO_SWITCH') {
          if (payload?.activeConcurso) {
            setActiveConcursoState(payload.activeConcurso);
          }
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
          setCargos(sortByOrden(JSON.parse(stored)));
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
          updatedList = [...prev.filter(c => c.id !== newRecord.id && Number(c.orden) !== Number(newRecord.orden)), newRecord];
        } else if (eventType === 'UPDATE') {
          updatedList = prev.map(c => (c.id === newRecord.id ? newRecord : c));
        } else if (eventType === 'DELETE') {
          updatedList = prev.filter(c => c.id !== oldRecord.id);
        } else {
          updatedList = prev;
        }
        return sortByOrden(updatedList);
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
          const currentUser = sessionData?.session?.user || null;
          setSessionUser(currentUser);

          const { data, error: sbError } = await supabase
            .from(SUPABASE_TABLE)
            .select('*')
            .order('orden', { ascending: true });

          if (sbError) {
            console.error('Error al consultar Supabase:', sbError);
            setError(sbError.message);
            cargarDatosLocales();
          } else if (data && data.length > 0) {
            setCargos(sortByOrden(data));
            setIsRealtimeConnected(true);
          } else if (currentUser) {
            const seedRows = INITIAL_CARGOS.map((c) => toSupabasePayload(c));
            const { data: insertedRows, error: insertError } = await supabase
              .from(SUPABASE_TABLE)
              .insert(seedRows)
              .select();

            if (!insertError && insertedRows) {
              setCargos(sortByOrden(insertedRows));
              setIsRealtimeConnected(true);
            } else {
              console.error('Error al inicializar datos en Supabase:', insertError);
              setError(insertError?.message || null);
              setCargos([]);
            }
          } else {
            setCargos([]);
            setIsRealtimeConnected(true);
          }

          try {
            const { data: cfgData } = await supabase
              .from('concurso_config')
              .select('value')
              .eq('key', 'active_concurso')
              .maybeSingle();
            if (cfgData?.value === 'traslado' || cfgData?.value === 'ingreso') {
              setActiveConcursoState(cfgData.value);
              localStorage.setItem(CONCURSO_STORAGE_KEY, cfgData.value);
            }
          } catch {
            // Si aún no existe la tabla concurso_config, continuar con valor local
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
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'concurso_config' },
              (payload) => {
                const nextVal = payload.new?.value;
                if (payload.new?.key === 'active_concurso' && (nextVal === 'traslado' || nextVal === 'ingreso')) {
                  setActiveConcursoState(nextVal);
                  try {
                    localStorage.setItem(CONCURSO_STORAGE_KEY, nextVal);
                  } catch {
                    // Ignorar
                  }
                }
              }
            )
            .subscribe((status) => {
              setIsRealtimeConnected(status === 'SUBSCRIBED');
            });
        } catch (err) {
          console.error('Fallo Supabase, usando local:', err);
          setError(err.message);
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

  const logHistorialSupabase = useCallback(async (previousState, savedRow) => {
    if (!usingSupabase || !supabase || !savedRow?.id || !UUID_REGEX.test(savedRow.id)) return;
    try {
      await supabase.from('historial_cambios').insert({
        cargo_id: savedRow.id,
        orden: savedRow.orden,
        estado_anterior: previousState.estado,
        estado_nuevo: savedRow.estado,
        datos_anteriores: previousState,
        datos_nuevos: savedRow,
        usuario: sessionUser?.email || 'admin'
      });
    } catch (err) {
      console.warn('Aviso al registrar historial:', err);
    }
  }, [usingSupabase, sessionUser]);

  const updateCargo = useCallback(async (cargoId, updateData, options = {}) => {
    const current = cargosRef.current.find(c => c.id === cargoId);
    if (!current) return false;

    const previousState = { ...current };
    const previousOrden = Number(previousState.orden);
    const targetOrden = updateData.orden !== undefined ? Number(updateData.orden) : previousOrden;

    if (!Number.isInteger(targetOrden) || targetOrden < 1) {
      setError('El número de orden debe ser un entero mayor o igual a 1.');
      return false;
    }

    const ordenChanged = targetOrden !== previousOrden;
    const conflictingCargo = ordenChanged
      ? cargosRef.current.find(c => c.id !== cargoId && Number(c.orden) === targetOrden)
      : null;

    if (conflictingCargo && !options.swapOrdenWithConflict) {
      setError(`El N° de orden ${targetOrden} ya está asignado a "${conflictingCargo.nombre}". Activá el intercambio para reasignarlo.`);
      return false;
    }

    // Determinar concurso_asignacion según la regla:
    // Si pasa a asignada o reservada y no se especificó concurso, hereda el activeConcurso.
    // Si pasa a disponible, se borra el concurso_asignacion.
    let targetConcurso = updateData.concurso_asignacion !== undefined
      ? updateData.concurso_asignacion
      : previousState.concurso_asignacion;

    const targetEstado = updateData.estado !== undefined ? updateData.estado : previousState.estado;

    if (targetEstado === 'disponible') {
      targetConcurso = null;
    } else if ((targetEstado === 'asignada' || targetEstado === 'reservada') && !targetConcurso) {
      targetConcurso = activeConcurso;
    }

    // Regla estricta de la Ley: en Traslado Definitivo NO se admiten reservas.
    // Un cargo asignado en Traslado Definitivo queda expresamente excluido de reservas posteriores.
    if (targetEstado === 'reservada' && targetConcurso === 'traslado') {
      console.warn('Los cargos asignados en Concurso de Traslado no admiten reservas.');
      return false;
    }

    const nowIso = new Date().toISOString();
    const updatedBy = sessionUser?.email || previousState.updated_by || '';

    const mergedCargo = {
      ...previousState,
      ...updateData,
      orden: targetOrden,
      concurso_asignacion: targetConcurso,
      updated_at: nowIso,
      updated_by: updatedBy
    };

    const swappedConflictCargo = conflictingCargo
      ? {
          ...conflictingCargo,
          orden: previousOrden,
          updated_at: nowIso,
          updated_by: updatedBy
        }
      : null;

    const undoItem = {
      id: `undo-${Date.now()}`,
      cargoId,
      orden: targetOrden,
      cargoNombre: previousState.nombre,
      previousData: previousState,
      newData: mergedCargo,
      timestamp: Date.now(),
      description: ordenChanged
        ? `Orden ${previousOrden} ➔ ${targetOrden} (${mergedCargo.nombre})`
        : `Orden ${targetOrden}: ${previousState.estado} ➔ ${mergedCargo.estado}`
    };

    const newUndoStack = [undoItem, ...undoStack.slice(0, 49)];
    setUndoStack(newUndoStack);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newUndoStack));
    } catch {
      // Ignorar error de cuota
    }

    setCargos((prev) => {
      const updated = sortByOrden(
        prev.map(c => {
          if (c.id === cargoId) return mergedCargo;
          if (swappedConflictCargo && c.id === swappedConflictCargo.id) return swappedConflictCargo;
          return c;
        })
      );
      if (!usingSupabase) {
        persistirLocal(updated, cargoId, {
          orden: targetOrden,
          nombre: mergedCargo.nombre,
          estado: mergedCargo.estado,
          timestamp: Date.now()
        });
      }
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
        if (swappedConflictCargo) {
          // Intercambio en 3 pasos para respetar el constraint UNIQUE(orden) en Supabase
          const tempOrden = -Math.abs(Math.floor(Date.now() % 100000000) + previousOrden);

          const { error: step1Err } = await supabase
            .from(SUPABASE_TABLE)
            .update({ orden: tempOrden })
            .eq('id', cargoId);

          if (step1Err) throw step1Err;

          const { data: savedConflictRow, error: step2Err } = await supabase
            .from(SUPABASE_TABLE)
            .update({ orden: previousOrden, updated_at: nowIso, updated_by: updatedBy })
            .eq('id', swappedConflictCargo.id)
            .select()
            .single();

          if (step2Err) {
            await supabase.from(SUPABASE_TABLE).update({ orden: previousOrden }).eq('id', cargoId);
            throw step2Err;
          }

          const dbPayload = toSupabasePayload(mergedCargo);
          const { data: savedRow, error: step3Err } = await supabase
            .from(SUPABASE_TABLE)
            .update(dbPayload)
            .eq('id', cargoId)
            .select()
            .single();

          if (step3Err) throw step3Err;

          setCargos((prev) =>
            sortByOrden(
              prev.map(c => {
                if (savedRow && c.id === cargoId) return savedRow;
                if (savedConflictRow && c.id === swappedConflictCargo.id) return savedConflictRow;
                return c;
              })
            )
          );
          if (savedRow) {
            setLastUpdatedId(savedRow.id);
            await logHistorialSupabase(previousState, savedRow);
          }
        } else {
          const dbPayload = toSupabasePayload(mergedCargo);
          const query = supabase.from(SUPABASE_TABLE).update(dbPayload);
          const { data: savedRow, error: sbErr } = await (
            UUID_REGEX.test(String(cargoId))
              ? query.eq('id', cargoId)
              : query.eq('orden', previousOrden)
          )
            .select()
            .single();

          if (sbErr) {
            console.error('Error al actualizar cargo en Supabase:', sbErr);
            setError(sbErr.message);
            setCargos((prev) => sortByOrden(prev.map(c => c.id === cargoId ? previousState : c)));
            return false;
          }

          if (savedRow) {
            setCargos((prev) => sortByOrden(prev.map(c => (c.id === cargoId || c.id === savedRow.id) ? savedRow : c)));
            setLastUpdatedId(savedRow.id);
            await logHistorialSupabase(previousState, savedRow);
          }
        }
      } catch (err) {
        console.error('Fallo de red Supabase:', err);
        setError(err.message);
        setCargos((prev) =>
          sortByOrden(
            prev.map(c => {
              if (c.id === cargoId) return previousState;
              if (conflictingCargo && c.id === conflictingCargo.id) return conflictingCargo;
              return c;
            })
          )
        );
        return false;
      }
    }

    return true;
  }, [undoStack, usingSupabase, sessionUser, logHistorialSupabase, activeConcurso]);

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
      const restored = prev.map(c => (c.id === cargoId || Number(c.orden) === Number(orden)) ? previousData : c);
      if (!usingSupabase) {
        persistirLocal(restored, cargoId, {
          orden,
          nombre: previousData.nombre,
          estado: previousData.estado,
          restored: true,
          timestamp: Date.now()
        });
      }
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
        const dbPayload = toSupabasePayload({
          ...previousData,
          updated_at: new Date().toISOString(),
          updated_by: sessionUser?.email || previousData.updated_by || ''
        });
        const query = supabase.from(SUPABASE_TABLE).update(dbPayload);
        const { data: savedRow, error: sbErr } = await (
          UUID_REGEX.test(String(cargoId))
            ? query.eq('id', cargoId)
            : query.eq('orden', Number(orden))
        )
          .select()
          .single();

        if (sbErr) {
          console.error('Error revertir Supabase:', sbErr);
          setError(sbErr.message);
        } else if (savedRow) {
          setCargos((prev) => prev.map(c => (c.id === cargoId || Number(c.orden) === Number(savedRow.orden)) ? savedRow : c));
          setLastUpdatedId(savedRow.id);
        }
      } catch (err) {
        console.error('Error revertir Supabase:', err);
        setError(err.message);
      }
    }

    return lastAction;
  }, [undoStack, usingSupabase, sessionUser]);

  const batchSaveCargos = useCallback(async (newCargosList) => {
    const sortedLocal = sortByOrden(newCargosList);

    if (usingSupabase && supabase) {
      try {
        const dbRows = sortedLocal.map((c) =>
          toSupabasePayload({
            ...c,
            updated_at: new Date().toISOString(),
            updated_by: sessionUser?.email || c.updated_by || ''
          })
        );

        const { data: savedRows, error: sbErr } = await supabase
          .from(SUPABASE_TABLE)
          .upsert(dbRows, { onConflict: 'orden' })
          .select();

        if (sbErr) {
          console.error('Fallo batch Supabase:', sbErr);
          setError(sbErr.message);
          return false;
        }

        if (savedRows) {
          const ordered = sortByOrden(savedRows);
          setCargos(ordered);
        }
      } catch (err) {
        console.error('Fallo batch Supabase:', err);
        setError(err.message);
        return false;
      }
    } else {
      setCargos(sortedLocal);
      persistirLocal(sortedLocal);
    }

    return true;
  }, [usingSupabase, sessionUser]);

  const resetToOfficial = useCallback(async () => {
    setUndoStack([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // Ignorar
    }

    if (usingSupabase && supabase) {
      try {
        const { error: delErr } = await supabase.from(SUPABASE_TABLE).delete().neq('orden', -1);
        if (delErr) {
          console.error('Error al limpiar cargos en Supabase:', delErr);
          setError(delErr.message);
          return false;
        }

        const seedRows = INITIAL_CARGOS.map((c) =>
          toSupabasePayload({
            ...c,
            updated_at: new Date().toISOString(),
            updated_by: sessionUser?.email || ''
          })
        );

        const { data: insertedRows, error: insErr } = await supabase
          .from(SUPABASE_TABLE)
          .insert(seedRows)
          .select();

        if (insErr) {
          console.error('Error al reinsertar datos oficiales en Supabase:', insErr);
          setError(insErr.message);
          return false;
        }

        if (insertedRows) {
          setCargos(sortByOrden(insertedRows));
        }
      } catch (err) {
        console.error('Error resetear Supabase:', err);
        setError(err.message);
        return false;
      }
    } else {
      setCargos(INITIAL_CARGOS);
      persistirLocal(INITIAL_CARGOS);
    }

    return true;
  }, [usingSupabase, sessionUser]);

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
    let asignadasTraslado = 0;
    let asignadasIngreso = 0;
    let reservadasIngreso = 0;

    for (const c of cargos) {
      if (c.estado === 'disponible') {
        disponibles++;
      } else if (c.estado === 'asignada') {
        asignadas++;
        if (c.concurso_asignacion === 'traslado') {
          asignadasTraslado++;
        } else if (c.concurso_asignacion === 'ingreso') {
          asignadasIngreso++;
        }
      } else if (c.estado === 'reservada') {
        reservadas++;
        if (c.concurso_asignacion === 'traslado') {
          asignadasTraslado++;
        } else {
          asignadasIngreso++;
          reservadasIngreso++;
        }
      } else if (c.estado === 'no_habilitada') {
        noHabilitadas++;
      }
    }

    const habilitadasTotal = total - noHabilitadas;
    // Hasta el 50% de la totalidad de los cargos disponibles se cubren en Traslado Definitivo
    const cupoMaximoTraslado = Math.floor(habilitadasTotal * 0.5);
    const cupoRestanteTraslado = Math.max(0, cupoMaximoTraslado - asignadasTraslado);
    const isCupoTrasladoAlcanzado = asignadasTraslado >= cupoMaximoTraslado;

    return {
      total,
      disponibles,
      asignadas,
      reservadas,
      noHabilitadas,
      habilitadasTotal,
      cupoMaximoTraslado,
      asignadasTraslado,
      cupoRestanteTraslado,
      isCupoTrasladoAlcanzado,
      asignadasIngreso,
      reservadasIngreso
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
    activeConcurso,
    setActiveConcurso,
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
