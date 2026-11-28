import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useCargos } from '../context/CargosContext';
import { Navbar } from '../components/Navbar';
import { StatCounters } from '../components/StatCounters';
import { CargoCard } from '../components/CargoCard';
import { CargoDetailModal } from '../components/CargoDetailModal';
import { QuickActionModal } from '../components/QuickActionModal';
import { PdfImportModal } from '../components/PdfImportModal';
import { AdminLogin } from '../components/AdminLogin';
import { playChime } from '../lib/sound';
import { 
  RotateCcw, 
  Upload, 
  Download, 
  Search, 
  Filter, 
  LogOut, 
  History, 
  LayoutGrid, 
  Table as TableIcon,
  X,
  ArrowRightLeft,
  GraduationCap,
  AlertTriangle,
  Info,
  Layers
} from 'lucide-react';

export function AdminDashboard({ onNavigate }) {
  const { 
    cargos, 
    loading, 
    stats,
    undoStack, 
    lastUpdatedId,
    sessionUser,
    activeConcurso,
    setActiveConcurso,
    updateCargo, 
    undoLastAction, 
    batchSaveCargos,
    resetToOfficial,
    logoutAdmin 
  } = useCargos();

  // Estados de navegación e interfaz
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('todos');
  const [selectedRegion, setSelectedRegion] = useState('todas');
  const [viewMode, setViewMode] = useState('cards');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Modales
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [selectedCargoForDetail, setSelectedCargoForDetail] = useState(null);
  const [quickActionState, setQuickActionState] = useState({
    isOpen: false,
    cargo: null,
    actionType: 'asignar'
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [undoNotice, setUndoNotice] = useState(null);
  const searchInputRef = useRef(null);

  const focusSearchInput = (selectText = false) => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return;
    setTimeout(() => {
      const input = searchInputRef.current;
      if (input) {
        input.focus();
        if (selectText && input.value) {
          input.select();
        }
      }
    }, 60);
  };

  // Hacer focus automático en el buscador al abrir la página de Admin
  useEffect(() => {
    if (sessionUser) {
      focusSearchInput(false);
    }
  }, [sessionUser]);

  // Lista de regiones únicas
  const regionesDisponibles = useMemo(() => {
    const setReg = new Set(cargos.map((c) => c.region).filter(Boolean));
    return ['todas', ...Array.from(setReg).sort()];
  }, [cargos]);

  // Filtrado de vacantes
  const filteredCargos = useMemo(() => {
    return cargos.filter((c) => {
      if (selectedEstado !== 'todos' && c.estado !== selectedEstado) return false;
      if (selectedRegion !== 'todas' && c.region !== selectedRegion) return false;
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase().trim();
        const matchOrden = c.orden.toString().includes(query);
        const matchNombre = c.nombre.toLowerCase().includes(query);
        const matchLocalidad = c.localidad.toLowerCase().includes(query);
        const matchBp = c.bp ? c.bp.toString().toLowerCase().includes(query) : false;
        const matchRegion = c.region.toLowerCase().includes(query);
        const matchTitular = c.titular_nombre ? c.titular_nombre.toLowerCase().includes(query) : false;
        return matchOrden || matchNombre || matchLocalidad || matchBp || matchRegion || matchTitular;
      }
      return true;
    });
  }, [cargos, selectedEstado, selectedRegion, searchTerm]);

  // Si no hay sesión iniciada, mostrar pantalla de login (llamada después de los hooks)
  if (!sessionUser) {
    return (
      <AdminLogin
        onCancel={() => onNavigate('/')}
        onLoginSuccess={() => {}}
      />
    );
  }

  // Manejar acción rápida de un clic con validaciones reglamentarias
  const handleQuickAction = (cargo, action) => {
    if (action === 'asignar') {
      if (activeConcurso === 'traslado' && stats.isCupoTrasladoAlcanzado) {
        setUndoNotice(`¡Atención! Se ha completado el cupo del 50% (${stats.cupoMaximoTraslado} vacantes) de Traslado Definitivo. Cambie al Concurso de Ingreso a la Docencia.`);
        if (soundEnabled) playChime('warning');
        setTimeout(() => setUndoNotice(null), 5000);
        return;
      }
      setQuickActionState({
        isOpen: true,
        cargo,
        actionType: 'asignar'
      });
    } else if (action === 'reservar') {
      if (cargo.concurso_asignacion === 'traslado') {
        setUndoNotice('Los cargos adjudicados en Traslado Definitivo no admiten reservas reglamentariamente (Ley 647-E).');
        setTimeout(() => setUndoNotice(null), 4000);
        return;
      }
      setQuickActionState({
        isOpen: true,
        cargo,
        actionType: 'reservar'
      });
    } else if (action === 'liberar') {
      updateCargo(cargo.id, {
        estado: 'disponible',
        concurso_asignacion: null,
        titular_nombre: '',
        titular_dni: '',
        reserva_nombre: '',
        reserva_dni: ''
      });
      if (soundEnabled) playChime('success');
      focusSearchInput(true);
    } else if (action === 'habilitar') {
      updateCargo(cargo.id, {
        estado: 'disponible',
        concurso_asignacion: null
      });
      if (soundEnabled) playChime('success');
      focusSearchInput(true);
    }
  };

  // Confirmar desde el modal de acción rápida
  const handleConfirmQuickModal = ({ cargoId, actionType, nombre, dni, concurso_asignacion }) => {
    if (actionType === 'asignar') {
      updateCargo(cargoId, {
        estado: 'asignada',
        concurso_asignacion: concurso_asignacion || activeConcurso,
        titular_nombre: nombre || 'Aspirante Titular',
        titular_dni: dni
      });
      if (soundEnabled) playChime('assign');
    } else if (actionType === 'reservar') {
      updateCargo(cargoId, {
        estado: 'reservada',
        reserva_nombre: nombre || 'Aspirante en Reserva',
        reserva_dni: dni
      });
      if (soundEnabled) playChime('reserve');
    }
    focusSearchInput(true);
  };

  // Deshacer último cambio con aviso visual
  const handleUndo = async () => {
    const undoneAction = await undoLastAction();
    if (undoneAction) {
      if (soundEnabled) playChime('success');
      setUndoNotice(`Se deshizo: ${undoneAction.description}`);
      setTimeout(() => setUndoNotice(null), 4000);
    }
  };

  // Exportar el estado actual a un archivo CSV descargable
  const handleExportCSV = () => {
    const headers = ['Orden', 'Región', 'Establecimiento', 'B.P.', 'Cat.', 'Mod.', 'Zona', 'Jornada', 'Localidad', 'Origen', 'Estado', 'Concurso Adjudicación', 'Titular Nombre', 'Titular DNI', 'Reserva Nombre', 'Reserva DNI', 'Normativa'];
    const rows = cargos.map(c => [
      c.orden,
      `"${c.region || ''}"`,
      `"${c.nombre || ''}"`,
      c.bp || '',
      c.cat || '',
      c.mod || '',
      c.zona || '',
      c.jornada || '',
      `"${c.localidad || ''}"`,
      `"${c.origen || ''}"`,
      c.estado,
      c.concurso_asignacion === 'traslado' ? 'Traslado Definitivo' : c.concurso_asignacion === 'ingreso' ? 'Ingreso a la Docencia' : '',
      `"${c.titular_nombre || ''}"`,
      `"${c.titular_dni || ''}"`,
      `"${c.reserva_nombre || ''}"`,
      `"${c.reserva_dni || ''}"`,
      `"${c.etiqueta_normativa || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Acta_Concurso_Cargos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        projectorMode={false}
        onToggleProjector={() => {}}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        currentRoute="/admin"
        onNavigate={onNavigate}
      />

      {undoNotice && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 font-bold text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <RotateCcw className="w-4 h-4 animate-spin" />
            <span>{undoNotice}</span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 border-b border-slate-800 pb-4 sm:pb-5">
          <div>
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-black bg-sky-500/20 text-sky-400 border border-sky-500/30">
                MESA DE OPERACIONES EN VIVO
              </span>
              <span className="text-xs text-slate-400 truncate max-w-full">
                Sesión: <strong className="text-slate-200">{sessionUser?.email || 'Administrador'}</strong>
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-white leading-tight">
              Gestor de Vacantes y Adjudicaciones en Tiempo Real
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Concurso N° 55 (Traslado Definitivo) y Concurso N° 47 (Ingreso a la Docencia) • Ley 647-E
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-md ${
                undoStack.length > 0
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/40 ring-2 ring-amber-400/50'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50 border border-slate-700'
              }`}
              title="Corregir de inmediato el último clic accidental"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Deshacer ({undoStack.length})</span>
            </button>

            <button
              onClick={() => setShowHistoryModal(true)}
              className="p-2.5 sm:p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              title="Ver historial de últimos movimientos"
            >
              <History className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-950/40 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Importar PDF / Normas</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="p-2.5 sm:p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              title="Descargar Acta en CSV / Excel"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={logoutAdmin}
              className="p-2.5 sm:p-2 rounded-xl text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/40 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SELECTOR DE CONCURSO ACTIVO PARA OPERAR */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                Configuración del Concurso en Operación:
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Seleccione el concurso activo para registrar adjudicaciones y reservas según las reglas normativas.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400">Modo activo:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                activeConcurso === 'traslado'
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
              }`}>
                {activeConcurso === 'traslado' ? 'Traslado Definitivo' : 'Ingreso a la Docencia'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Opción 1: Traslado Definitivo */}
            <button
              type="button"
              onClick={() => setActiveConcurso('traslado')}
              className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                activeConcurso === 'traslado'
                  ? 'bg-gradient-to-br from-sky-950/80 via-sky-900/40 to-slate-900 border-sky-400 ring-2 ring-sky-400/40 shadow-xl'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${
                    activeConcurso === 'traslado' ? 'bg-sky-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm">
                      Concurso de Traslado Definitivo
                    </h3>
                    <span className="text-[11px] text-sky-300 font-medium block">
                      Hasta 50% de vacantes • Sin reservas
                    </span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                  activeConcurso === 'traslado'
                    ? 'bg-sky-400 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {activeConcurso === 'traslado' ? 'ACTIVO' : 'SELECCIONAR'}
                </span>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Cupo adjudicado: <strong className="text-white font-mono">{stats.asignadasTraslado}</strong> / {stats.cupoMaximoTraslado} ({stats.cupoRestanteTraslado} restan)
                </span>
                <span className="font-semibold text-rose-300 text-[11px]">
                  • Sin reservas
                </span>
              </div>
            </button>

            {/* Opción 2: Ingreso a la Docencia */}
            <button
              type="button"
              onClick={() => setActiveConcurso('ingreso')}
              className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                activeConcurso === 'ingreso'
                  ? 'bg-gradient-to-br from-purple-950/80 via-purple-900/40 to-slate-900 border-purple-400 ring-2 ring-purple-400/40 shadow-xl'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${
                    activeConcurso === 'ingreso' ? 'bg-purple-500 text-white font-black' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm">
                      Concurso de Ingreso a la Docencia
                    </h3>
                    <span className="text-[11px] text-purple-300 font-medium block">
                      Vacantes restantes • Con reservas de ingreso
                    </span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                  activeConcurso === 'ingreso'
                    ? 'bg-purple-400 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {activeConcurso === 'ingreso' ? 'ACTIVO' : 'SELECCIONAR'}
                </span>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Adjudicadas: <strong className="text-white font-mono">{stats.asignadasIngreso}</strong> • Reservas: <strong className="text-white font-mono">{stats.reservadasIngreso}</strong>
                </span>
                <span className="font-semibold text-emerald-400 text-[11px]">
                  • Admite reservas
                </span>
              </div>
            </button>
          </div>

          {/* Banner informativo de normas operativas */}
          {activeConcurso === 'traslado' ? (
            stats.isCupoTrasladoAlcanzado ? (
              <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center gap-2.5 text-xs text-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <span>
                  <strong>¡Cupo máximo del 50% alcanzado!</strong> Se han cubierto {stats.cupoMaximoTraslado} cargos para Traslado Definitivo. Para continuar con los cargos restantes, seleccione el <strong>Concurso de Ingreso a la Docencia</strong>.
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-800/60 flex items-center gap-2.5 text-xs text-sky-200">
                <Info className="w-5 h-5 text-sky-400 flex-shrink-0" />
                <span>
                  <strong>Modo Traslado Definitivo activo:</strong> Se puede cubrir hasta el 50% de la totalidad de vacantes ({stats.cupoRestanteTraslado} disponibles en este cupo). En este concurso los cargos no admiten reservas (Ley 647-E).
                </span>
              </div>
            )
          ) : (
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/60 flex items-center gap-2.5 text-xs text-purple-200">
              <Info className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <span>
                <strong>Modo Ingreso a la Docencia activo:</strong> Se adjudican las vacantes disponibles restantes. En este concurso SÍ se pueden tomar reservas (2° aspirante) exclusivamente sobre los cargos adjudicados en esta etapa.
              </span>
            </div>
          )}
        </div>

        <StatCounters projectorMode={false} />

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-xl space-y-4">
          {/* Buscador destacado de cargos */}
          <div className="space-y-1.5">
            <label htmlFor="admin-cargo-search" className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              Buscador Rápido de Cargos
            </label>
            <div className="relative">
              <Search className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="admin-cargo-search"
                ref={searchInputRef}
                type="text"
                placeholder="Buscar orden, biblioteca, localidad o B.P..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border-2 border-sky-500/50 rounded-xl sm:rounded-2xl pl-11 sm:pl-14 pr-10 sm:pr-12 py-3 sm:py-4 text-sm sm:text-xl font-semibold text-white placeholder-slate-400 shadow-lg shadow-sky-950/30 focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-500/25 transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    focusSearchInput(false);
                  }}
                  title="Limpiar búsqueda"
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-7">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="todas">Todas las Regiones Educativas</option>
                {regionesDisponibles.filter(r => r !== 'todas').map(reg => (
                  <option key={reg} value={reg}>{reg}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-5 flex items-center justify-end gap-2">
              <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                    viewMode === 'cards' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Vista de Tarjetas Grandes"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">Tarjetas</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                    viewMode === 'table' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Vista de Tabla Rápida"
                >
                  <TableIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Tabla</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Estado:
            </span>
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'disponible', label: `Disponibles (${stats.disponibles})` },
              { id: 'asignada', label: `Adjudicadas (${stats.asignadas})` },
              { id: 'reservada', label: `Reservadas (${stats.reservadas})` },
              { id: 'no_habilitada', label: `Desafectadas (${stats.noHabilitadas})` }
            ].map(btn => {
              const active = selectedEstado === btn.id;
              return (
                <button
                  key={btn.id}
                  onClick={() => setSelectedEstado(btn.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
                    active
                      ? 'bg-sky-600 text-white border-sky-400 shadow-md'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                  }`}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <p className="font-semibold text-sm">Cargando vacantes del concurso...</p>
          </div>
        ) : filteredCargos.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800 p-8 space-y-3">
            <Search className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No hay vacantes coincidentes</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Revisa los filtros aplicados o limpia la búsqueda.
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCargos.map((cargo) => (
              <CargoCard
                key={cargo.id || cargo.orden}
                cargo={cargo}
                adminMode={true}
                isRecentlyUpdated={cargo.id === lastUpdatedId}
                onSelect={(c) => setSelectedCargoForDetail(c)}
                onQuickAction={handleQuickAction}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-700">
                <tr>
                  <th className="p-3 w-16 text-center">N°</th>
                  <th className="p-3">Establecimiento / Biblioteca</th>
                  <th className="p-3">Localidad</th>
                  <th className="p-3">Región</th>
                  <th className="p-3">Estado Actual</th>
                  <th className="p-3">Titular Adjudicado</th>
                  <th className="p-3">Reserva</th>
                  <th className="p-3 text-right">Acciones Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {filteredCargos.map((cargo) => (
                  <tr
                    key={cargo.id || cargo.orden}
                    onClick={() => setSelectedCargoForDetail(cargo)}
                    className={`hover:bg-slate-800/50 transition-colors cursor-pointer ${
                      cargo.id === lastUpdatedId ? 'bg-amber-500/10' : ''
                    } ${cargo.estado === 'no_habilitada' ? 'opacity-25 grayscale' : ''}`}
                  >
                    <td className="p-3 text-center font-mono font-black text-sky-400">
                      N° {cargo.orden}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-white line-clamp-1">{cargo.nombre}</div>
                      {cargo.bp && <span className="text-[11px] text-sky-300 font-mono">B.P. {cargo.bp}</span>}
                      {cargo.etiqueta_normativa && (
                        <span className="ml-2 text-[10px] text-amber-400 font-semibold">
                          • {cargo.etiqueta_normativa}
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-rose-300">
                      {cargo.localidad}
                    </td>
                    <td className="p-3 text-slate-400 truncate max-w-[150px]">
                      {cargo.region}
                    </td>
                    <td className="p-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        cargo.estado === 'disponible'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                          : cargo.estado === 'asignada'
                          ? (cargo.concurso_asignacion === 'traslado' ? 'bg-sky-500 text-slate-950 border-sky-400' : 'bg-amber-500 text-slate-950 border-amber-400')
                          : cargo.estado === 'reservada'
                          ? 'bg-rose-600 text-white border-rose-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {cargo.estado === 'asignada' ? 'Adjudicada' : cargo.estado}
                      </span>
                    </td>
                    <td className="p-3">
                      {cargo.concurso_asignacion === 'traslado' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-950 text-sky-300 border border-sky-500/50 shadow-sm">
                          <ArrowRightLeft className="w-3 h-3 text-sky-400" />
                          Traslado
                        </span>
                      ) : cargo.concurso_asignacion === 'ingreso' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-950 text-purple-300 border border-purple-500/50 shadow-sm">
                          <GraduationCap className="w-3 h-3 text-purple-400" />
                          Ingreso
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px]">—</span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-amber-200 truncate max-w-[140px]">
                      {cargo.titular_nombre || '—'}
                    </td>
                    <td className="p-3 font-mono text-rose-200 truncate max-w-[140px]">
                      {cargo.reserva_nombre || '—'}
                    </td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {cargo.estado === 'disponible' && (
                          <button
                            onClick={() => handleQuickAction(cargo, 'asignar')}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
                          >
                            Adjudicar
                          </button>
                        )}
                        {cargo.estado === 'asignada' && (
                          <>
                            {cargo.concurso_asignacion === 'traslado' ? (
                              <span className="text-[10px] text-sky-300 font-semibold bg-sky-950/60 px-2 py-1 rounded border border-sky-800">
                                Sin reserva
                              </span>
                            ) : (
                              <button
                                onClick={() => handleQuickAction(cargo, 'reservar')}
                                className="px-2 py-1 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                              >
                                Reserva
                              </button>
                            )}
                            <button
                              onClick={() => handleQuickAction(cargo, 'liberar')}
                              className="px-2 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                            >
                              Liberar
                            </button>
                          </>
                        )}
                        {cargo.estado === 'reservada' && (
                          <button
                            onClick={() => handleQuickAction(cargo, 'liberar')}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-600/50 transition-colors"
                          >
                            Liberar
                          </button>
                        )}
                        {cargo.estado === 'no_habilitada' && (
                          <button
                            onClick={() => handleQuickAction(cargo, 'habilitar')}
                            className="px-2 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                          >
                            Habilitar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <QuickActionModal
        isOpen={quickActionState.isOpen}
        cargo={quickActionState.cargo}
        actionType={quickActionState.actionType}
        onClose={() => {
          setQuickActionState({ isOpen: false, cargo: null, actionType: 'asignar' });
          focusSearchInput(true);
        }}
        onConfirm={handleConfirmQuickModal}
      />

      <CargoDetailModal
        cargo={selectedCargoForDetail}
        isOpen={Boolean(selectedCargoForDetail)}
        onClose={() => {
          setSelectedCargoForDetail(null);
          focusSearchInput(true);
        }}
        isAdmin={true}
        onSave={async (cargoId, updateData, options) => {
          const ok = await updateCargo(cargoId, updateData, options);
          if (ok && soundEnabled) {
            if (updateData.estado === 'reservada') playChime('reserve');
            else if (updateData.estado === 'asignada') playChime('assign');
            else playChime('success');
          }
          focusSearchInput(true);
        }}
      />

      <PdfImportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onSaveBatch={(batch) => batchSaveCargos(batch)}
      />

      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 max-h-[85vh] sm:max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-white text-base">
                  Historial de Movimientos del Acto ({undoStack.length})
                </h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {undoStack.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-500">
                  No hay movimientos registrados en esta sesión aún.
                </p>
              ) : (
                undoStack.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="font-bold text-white block">
                        {item.description}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {item.cargoNombre}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
              <button
                onClick={resetToOfficial}
                className="text-xs text-rose-400 hover:text-rose-300 font-bold"
              >
                Restablecer a Datos Oficiales Iniciales
              </button>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante de Deshacer rápido en móvil */}
      {undoStack.length > 0 && (
        <button
          onClick={handleUndo}
          className="sm:hidden fixed bottom-4 right-4 z-40 flex items-center gap-2 px-4 py-3 rounded-full text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-2xl shadow-amber-950/60 ring-2 ring-amber-300/60 active:scale-95 transition-transform"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Deshacer ({undoStack.length})</span>
        </button>
      )}
    </div>
  );
}
