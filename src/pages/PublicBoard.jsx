import React, { useState, useMemo, useEffect } from 'react';
import { useCargos } from '../context/CargosContext';
import { Navbar } from '../components/Navbar';
import { StatCounters } from '../components/StatCounters';
import { CargoCard } from '../components/CargoCard';
import { CargoDetailModal } from '../components/CargoDetailModal';
import { playChime } from '../lib/sound';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  Ban,
  Radio,
  X
} from 'lucide-react';

export function PublicBoard({ onNavigate }) {
  const { cargos, loading, lastUpdatedId, lastUpdateNotice } = useCargos();

  // Estados de interfaz
  const [projectorMode, setProjectorMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('todos'); // 'todos' | 'disponible' | 'asignada' | 'reservada' | 'no_habilitada'
  const [selectedRegion, setSelectedRegion] = useState('todas');
  const [selectedCargo, setSelectedCargo] = useState(null);
  const [showLiveBanner, setShowLiveBanner] = useState(false);

  // Reproducir sonido cuando llega una actualización en vivo
  useEffect(() => {
    if (lastUpdateNotice) {
      if (soundEnabled) {
        if (lastUpdateNotice.estado === 'reservada') {
          playChime('reserve');
        } else if (lastUpdateNotice.estado === 'asignada') {
          playChime('assign');
        } else {
          playChime('success');
        }
      }
      setShowLiveBanner(true);
      const timer = setTimeout(() => setShowLiveBanner(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdateNotice, soundEnabled]);

  // Lista de regiones únicas para el filtro
  const regionesDisponibles = useMemo(() => {
    const setReg = new Set(cargos.map((c) => c.region).filter(Boolean));
    return ['todas', ...Array.from(setReg).sort()];
  }, [cargos]);

  // Filtrado reactivo en tiempo real
  const filteredCargos = useMemo(() => {
    return cargos.filter((c) => {
      // Filtro de estado
      if (selectedEstado !== 'todos' && c.estado !== selectedEstado) {
        return false;
      }
      // Filtro de región
      if (selectedRegion !== 'todas' && c.region !== selectedRegion) {
        return false;
      }
      // Búsqueda por texto (orden, nombre, localidad, bp, región)
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

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col ${
      projectorMode ? 'text-lg select-none' : ''
    }`}>
      {/* Barra de navegación superior */}
      <Navbar
        projectorMode={projectorMode}
        onToggleProjector={() => setProjectorMode(!projectorMode)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        currentRoute="/"
        onNavigate={onNavigate}
      />

      {/* Notificación flotante de actualización en vivo */}
      {showLiveBanner && lastUpdateNotice && (
        <div className="fixed top-20 right-4 z-50 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 p-4 rounded-2xl shadow-2xl border-2 border-yellow-200 animate-slideIn flex items-center gap-3 max-w-md">
          <div className="p-2 rounded-xl bg-slate-950 text-amber-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                ¡Pizarra Actualizada en Vivo!
              </span>
              <button onClick={() => setShowLiveBanner(false)} className="text-slate-900 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm font-bold truncate">
              Orden N° {lastUpdateNotice.orden}: {lastUpdateNotice.nombre}
            </p>
            <p className="text-xs font-semibold uppercase">
              Estado: <span className="font-mono">{lastUpdateNotice.estado.replace('_', ' ')}</span>
            </p>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Cabecera del Concurso */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                PIZARRA PÚBLICA EN DIRECTO
              </span>
              {projectorMode && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950 uppercase tracking-wider">
                  Modo Proyector Activo
                </span>
              )}
            </div>
            <h1 className={`font-extrabold tracking-tight text-white ${
              projectorMode ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
            }`}>
              Concurso de Traslados y Reincorporaciones N° 55 e Ingreso N° 47
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Cargos Bibliotecarios • Ley 647-E Art. 266 • Junta de Clasificación de Nivel Primario y Modalidades
            </p>
          </div>

          {/* Botón rápido para limpiar filtros si hay alguno activo */}
          {(searchTerm || selectedEstado !== 'todos' || selectedRegion !== 'todas') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedEstado('todos');
                setSelectedRegion('todas');
              }}
              className="self-start md:self-auto flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 bg-sky-950/40 px-3 py-1.5 rounded-xl border border-sky-800/60 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restablecer Filtros
            </button>
          )}
        </div>

        {/* Tablero de Métricas / Contadores en Vivo */}
        <StatCounters projectorMode={projectorMode} />

        {/* Barra de Filtros y Búsqueda (En modo proyector se compacta para maximizar visualización) */}
        <div className={`p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-3 ${
          projectorMode ? 'bg-slate-900/60 py-2.5' : ''
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Buscador predictivo instantáneo */}
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por N° Orden, Biblioteca, Localidad, B.P. o Región..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all ${
                  projectorMode ? 'py-3 text-base' : 'py-2.5 text-sm'
                }`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Selector de Región Educativa */}
            <div className="md:col-span-6">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className={`w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 text-slate-200 focus:outline-none focus:border-sky-500 transition-all ${
                  projectorMode ? 'py-3 text-base' : 'py-2.5 text-sm'
                }`}
              >
                <option value="todas">Todas las Regiones Educativas ({regionesDisponibles.length - 1})</option>
                {regionesDisponibles
                  .filter((r) => r !== 'todas')
                  .map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Pastillas de filtro por Estado */}
          {!projectorMode && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" /> Estado:
              </span>
              {[
                { id: 'todos', label: 'Todos', icon: Layers },
                { id: 'disponible', label: 'Disponibles', icon: CheckCircle2, color: 'text-emerald-400' },
                { id: 'asignada', label: 'Asignadas', icon: Clock, color: 'text-amber-400' },
                { id: 'reservada', label: 'Completas / Reservadas', icon: UserCheck, color: 'text-rose-400' },
                { id: 'no_habilitada', label: 'No Habilitadas', icon: Ban, color: 'text-slate-400' }
              ].map((btn) => {
                const Icon = btn.icon;
                const active = selectedEstado === btn.id;
                return (
                  <button
                    key={btn.id}
                    onClick={() => setSelectedEstado(btn.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                      active
                        ? 'bg-sky-600 text-white border-sky-400 shadow-md'
                        : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : btn.color || 'text-slate-400'}`} />
                    {btn.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Resumen de resultados */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>
            Mostrando <strong className="text-white font-mono">{filteredCargos.length}</strong> de <strong className="text-white font-mono">{cargos.length}</strong> vacantes
          </span>
          {projectorMode && (
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Vista optimizada de alto contraste
            </span>
          )}
        </div>

        {/* Grilla interactiva de Cargos */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <p className="font-semibold text-sm">Cargando pizarra oficial del concurso...</p>
          </div>
        ) : filteredCargos.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800 p-8 space-y-3">
            <Search className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No se encontraron vacantes</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              No hay cargos que coincidan con los criterios de búsqueda y filtros seleccionados.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedEstado('todos');
                setSelectedRegion('todas');
              }}
              className="mt-2 px-4 py-2 text-xs font-bold rounded-xl bg-sky-600 text-white hover:bg-sky-500"
            >
              Ver todas las vacantes
            </button>
          </div>
        ) : (
          <div className={`grid gap-4 ${
            projectorMode
              ? 'grid-cols-1 lg:grid-cols-2 gap-5'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {filteredCargos.map((cargo) => (
              <CargoCard
                key={cargo.id || cargo.orden}
                cargo={cargo}
                projectorMode={projectorMode}
                isRecentlyUpdated={cargo.id === lastUpdatedId || cargo.orden === lastUpdateNotice?.orden}
                onSelect={(c) => setSelectedCargo(c)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal de Detalle de Cargo (Solo Lectura en Vista Pública) */}
      <CargoDetailModal
        cargo={selectedCargo}
        isOpen={Boolean(selectedCargo)}
        onClose={() => setSelectedCargo(null)}
        isAdmin={false}
      />
    </div>
  );
}
