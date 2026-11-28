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
  UserCheck, 
  Ban,
  Radio,
  X,
  LayoutGrid,
  List,
  ArrowRightLeft,
  GraduationCap,
  ArrowUp
} from 'lucide-react';

export function PublicBoard({ onNavigate }) {
  const { cargos, loading, lastUpdatedId, lastUpdateNotice, activeConcurso } = useCargos();

  // Estados de interfaz
  const [projectorMode, setProjectorMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [viewMode, setViewMode] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'cards' : 'table'
  ); // 'table' | 'cards'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('todos'); // 'todos' | 'disponible' | 'asignada' | 'reservada' | 'no_habilitada'
  const [selectedRegion, setSelectedRegion] = useState('todas');
  const [selectedCargo, setSelectedCargo] = useState(null);
  const [showLiveBanner, setShowLiveBanner] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 320);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      // Filtro de estado / concurso
      if (selectedEstado === 'traslado') {
        if (c.concurso_asignacion !== 'traslado' || c.estado === 'disponible') return false;
      } else if (selectedEstado === 'ingreso') {
        if (c.concurso_asignacion !== 'ingreso' || c.estado === 'disponible') return false;
      } else if (selectedEstado !== 'todos' && c.estado !== selectedEstado) {
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
        <div className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:top-20 sm:right-4 sm:bottom-auto z-50 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 p-3.5 sm:p-4 rounded-2xl shadow-2xl border-2 border-yellow-200 animate-slideIn flex items-center gap-3 sm:max-w-md">
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Cabecera del Concurso */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-b border-slate-800 pb-4 sm:pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                PIZARRA PÚBLICA EN DIRECTO
              </span>
              {projectorMode && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950 uppercase tracking-wider">
                  Modo Proyector Activo
                </span>
              )}
            </div>
            <h1 className={`font-extrabold tracking-tight text-white leading-tight ${
              projectorMode ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-3xl'
            }`}>
              Concurso de Traslados y Reincorporaciones N° 55 e Ingreso N° 47
            </h1>
            <div className="mt-2.5 sm:mt-3">
              {activeConcurso === 'traslado' ? (
                <div className={`inline-flex items-center gap-2.5 sm:gap-3 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl border-2 bg-gradient-to-r from-sky-600/30 via-sky-500/20 to-cyan-500/20 border-sky-400 text-white shadow-lg shadow-sky-900/40 ${
                  projectorMode ? 'text-lg sm:text-xl font-extrabold px-5 py-3' : 'text-xs sm:text-base font-extrabold'
                }`}>
                  <span className="p-1.5 rounded-xl bg-sky-400 text-slate-950 flex-shrink-0 shadow-sm">
                    <ArrowRightLeft className={projectorMode ? 'w-5 h-5' : 'w-4 h-4'} />
                  </span>
                  <span>
                    <span className="text-sky-300 font-black uppercase tracking-wider mr-1.5 sm:mr-2">CONCURSO ACTIVO:</span>
                    Concurso de Traslado Definitivo (Sin reservas)
                  </span>
                </div>
              ) : (
                <div className={`inline-flex items-center gap-2.5 sm:gap-3 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl border-2 bg-gradient-to-r from-purple-600/30 via-purple-500/20 to-fuchsia-500/20 border-purple-400 text-white shadow-lg shadow-purple-900/40 ${
                  projectorMode ? 'text-lg sm:text-xl font-extrabold px-5 py-3' : 'text-xs sm:text-base font-extrabold'
                }`}>
                  <span className="p-1.5 rounded-xl bg-purple-400 text-slate-950 flex-shrink-0 shadow-sm">
                    <GraduationCap className={projectorMode ? 'w-5 h-5' : 'w-4 h-4'} />
                  </span>
                  <span>
                    <span className="text-purple-300 font-black uppercase tracking-wider mr-1.5 sm:mr-2">CONCURSO ACTIVO:</span>
                    Concurso de Ingreso a la Docencia (Con reservas)
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Cargos Bibliotecarios • Ley 647-E • Junta de Clasificación de Bibliotecas
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
        <div className={`p-3 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-3 ${
          projectorMode ? 'bg-slate-900/60 py-2.5' : ''
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3 items-center">
            {/* Buscador predictivo instantáneo */}
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar orden, biblioteca, localidad o B.P..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-9 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all ${
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
            <div className="md:col-span-4">
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

            {/* Selector de Vista: Tabla / Tarjetas */}
            <div className="md:col-span-2 flex items-center justify-end gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('table')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'table' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Tabla
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'cards' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Tarjetas
              </button>
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
                { id: 'traslado', label: 'Traslado Definitivo', icon: ArrowRightLeft, color: 'text-sky-400' },
                { id: 'ingreso', label: 'Ingreso a la Docencia', icon: GraduationCap, color: 'text-purple-400' },
                { id: 'reservada', label: 'Con Reserva', icon: UserCheck, color: 'text-rose-400' },
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
        ) : viewMode === 'cards' ? (
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
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
            <table className={`w-full text-left ${projectorMode ? 'text-sm' : 'text-xs'}`}>
              <thead className="bg-slate-800 text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-700">
                <tr>
                  <th className="p-3 w-16 text-center">N°</th>
                  <th className="p-3">Establecimiento / Biblioteca</th>
                  <th className="p-3">B.P.</th>
                  <th className="p-3">Localidad</th>
                  <th className="p-3">Región</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Concurso</th>
                  <th className="p-3">Titular</th>
                  <th className="p-3">Reserva</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {filteredCargos.map((cargo) => {
                  const isRecent = cargo.id === lastUpdatedId || cargo.orden === lastUpdateNotice?.orden;
                  return (
                    <tr
                      key={cargo.id || cargo.orden}
                      onClick={() => setSelectedCargo(cargo)}
                      className={`hover:bg-slate-800/50 transition-colors cursor-pointer ${
                        isRecent ? 'bg-amber-500/10' : ''
                      } ${cargo.estado === 'no_habilitada' ? 'opacity-25 grayscale pointer-events-none' : ''}`}
                    >
                      <td className="p-3 text-center font-mono font-black text-sky-400 whitespace-nowrap">
                        N° {cargo.orden}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-white">{cargo.nombre}</div>
                        <div className="text-[11px] text-slate-400">
                          Cat: {cargo.cat || '1ª'} | Mod: {cargo.mod || 'Pública'} | Zona: {cargo.zona || 'ZU 1'} | Jornada: {cargo.jornada || 'Simple'}
                        </div>
                        {cargo.etiqueta_normativa && (
                          <span className="inline-block mt-0.5 text-[10px] text-amber-400 font-semibold">
                            • {cargo.etiqueta_normativa}
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-sky-300 whitespace-nowrap">
                        {cargo.bp || '—'}
                      </td>
                      <td className="p-3 font-semibold text-rose-300">
                        {cargo.localidad}
                      </td>
                      <td className="p-3 text-slate-400 truncate max-w-[180px]">
                        {cargo.region}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          cargo.estado === 'disponible'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                            : cargo.estado === 'asignada'
                            ? (cargo.concurso_asignacion === 'traslado' ? 'bg-sky-500 text-slate-950 border-sky-400' : 'bg-amber-500 text-slate-950 border-amber-400')
                            : cargo.estado === 'reservada'
                            ? 'bg-rose-600 text-white border-rose-500'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {cargo.estado === 'disponible'
                            ? 'Disponible'
                            : cargo.estado === 'asignada'
                            ? (cargo.concurso_asignacion === 'traslado' ? 'Adjudicada' : 'Adjudicada')
                            : cargo.estado === 'reservada'
                            ? 'RESERVADA'
                            : 'No Habilitada'}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
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
                      <td className="p-3 font-mono text-amber-200 truncate max-w-[160px]">
                        {cargo.titular_nombre || '—'}
                      </td>
                      <td className="p-3 font-mono text-rose-200 truncate max-w-[160px]">
                        {cargo.reserva_nombre || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Botón flotante para volver arriba en móvil */}
      {showScrollTop && !showLiveBanner && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Volver arriba"
          className="sm:hidden fixed bottom-5 right-4 z-40 p-3 rounded-full bg-sky-600 hover:bg-sky-500 text-white shadow-xl shadow-sky-950/50 border border-sky-400/50 transition-transform active:scale-95"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

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
