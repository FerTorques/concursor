import React from 'react';
import { 
  MapPin, 
  Clock, 
  User, 
  UserCheck, 
  Ban, 
  Sparkles, 
  ShieldAlert,
  ArrowRightLeft,
  GraduationCap
} from 'lucide-react';

export function CargoCard({ 
  cargo, 
  projectorMode = false, 
  isRecentlyUpdated = false,
  onSelect,
  adminMode = false,
  onQuickAction
}) {
  const {
    orden,
    region,
    nombre,
    bp,
    cat,
    mod,
    zona,
    jornada,
    localidad,
    origen,
    estado,
    concurso_asignacion,
    titular_nombre,
    titular_dni,
    reserva_nombre,
    reserva_dni,
    etiqueta_normativa
  } = cargo;

  const stateStyles = {
    no_habilitada: {
      card: 'bg-slate-950 border-slate-800/30 opacity-30 text-slate-500 grayscale pointer-events-none cursor-not-allowed',
      badge: 'bg-slate-900 text-slate-600 border-slate-800',
      badgeText: etiqueta_normativa?.toLowerCase().includes('desafectada') ? 'DESAFECTADA' : 'NO HABILITADA',
      icon: Ban,
      accent: 'border-l-4 border-l-slate-800'
    },
    disponible: {
      card: 'bg-slate-800/90 hover:bg-slate-800/100 border-emerald-500/40 text-slate-100 hover:border-emerald-400/80 shadow-emerald-950/20 shadow-md',
      badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
      badgeText: 'DISPONIBLE',
      icon: Sparkles,
      accent: 'border-l-4 border-l-emerald-500'
    },
    asignada: {
      card: 'bg-amber-950/40 hover:bg-amber-950/60 border-amber-500/70 text-amber-50 shadow-amber-950/30 shadow-lg ring-1 ring-amber-500/30',
      badge: concurso_asignacion === 'traslado'
        ? 'bg-sky-500 text-slate-950 font-black border-sky-400'
        : 'bg-amber-500 text-slate-950 font-black border-amber-400 animate-pulse-fast',
      badgeText: 'ADJUDICADA',
      icon: Clock,
      accent: concurso_asignacion === 'traslado' ? 'border-l-4 border-l-sky-400' : 'border-l-4 border-l-amber-400'
    },
    reservada: {
      card: 'bg-rose-950/50 hover:bg-rose-950/70 border-rose-500/80 text-rose-50 shadow-rose-950/40 shadow-lg ring-1 ring-rose-500/40',
      badge: 'bg-rose-600 text-white font-black border-rose-400 shadow-md',
      badgeText: 'RESERVADA',
      icon: UserCheck,
      accent: 'border-l-4 border-l-rose-500'
    }
  };

  const currentStyle = stateStyles[estado] || stateStyles.disponible;
  const BadgeIcon = currentStyle.icon;

  return (
    <div
      onClick={() => onSelect && onSelect(cargo)}
      className={`relative rounded-xl border transition-all duration-300 p-4 ${currentStyle.card} ${currentStyle.accent} ${
        isRecentlyUpdated ? 'ring-4 ring-yellow-400 scale-[1.01] shadow-2xl z-10' : ''
      } ${projectorMode ? 'p-5 mb-1' : ''} cursor-pointer group`}
    >
      {isRecentlyUpdated && (
        <div className="absolute -top-3 right-2 sm:-right-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-extrabold text-[11px] sm:text-xs px-2.5 sm:px-3 py-0.5 rounded-full shadow-lg flex items-center gap-1 animate-bounce">
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          ¡ÚLTIMA ADJUDICACIÓN!
        </div>
      )}

      {/* Cabecera de la tarjeta */}
      <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2.5">
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap min-w-0">
          <span className={`inline-flex items-center justify-center font-mono font-black rounded-lg shadow-sm border ${
            estado === 'no_habilitada' 
              ? 'bg-slate-800 text-slate-400 border-slate-700' 
              : estado === 'asignada'
              ? 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold'
              : estado === 'reservada'
              ? 'bg-rose-600 text-white border-rose-500 font-extrabold'
              : 'bg-sky-600 text-white border-sky-400'
          } ${projectorMode ? 'px-3 py-1.5 text-2xl min-w-[70px]' : 'px-2.5 py-1 text-sm sm:text-base min-w-[50px] sm:min-w-[54px]'}`}>
            N° {orden}
          </span>

          {bp && (
            <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-md border ${
              estado === 'no_habilitada' ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-800 text-sky-300 border-slate-700'
            }`}>
              B.P. {bp}
            </span>
          )}

          <span className={`font-medium tracking-tight text-slate-300 truncate max-w-full sm:max-w-[280px] ${projectorMode ? 'text-base font-semibold' : 'text-xs'}`}>
            {region}
          </span>
        </div>

        <div className="flex-shrink-0">
          <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold border uppercase tracking-wider ${currentStyle.badge} ${
            projectorMode ? 'text-sm px-4 py-1.5' : ''
          }`}>
            <BadgeIcon className={projectorMode ? "w-4 h-4" : "w-3.5 h-3.5"} />
            {currentStyle.badgeText}
          </span>
        </div>
      </div>

      {/* Nombre y detalles del establecimiento */}
      <div className="mb-2">
        <h3 className={`font-bold tracking-tight text-white group-hover:text-sky-300 transition-colors ${
          projectorMode ? 'text-2xl leading-tight font-extrabold' : 'text-base sm:text-lg leading-snug'
        }`}>
          {nombre}
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 text-slate-300 mt-1 sm:mt-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            <span className={`font-semibold truncate ${projectorMode ? 'text-lg text-slate-200' : 'text-sm'}`}>
              {localidad}
            </span>
          </div>
          <span className="hidden sm:inline text-slate-500">•</span>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-slate-400">
            <span>Cat: <strong className="text-slate-200">{cat || '1ª'}</strong></span>
            <span className="text-slate-600">|</span>
            <span>Mod: <strong className="text-slate-200">{mod || 'Pública'}</strong></span>
            <span className="text-slate-600">|</span>
            <span>Zona: <strong className="text-slate-200">{zona || 'ZU 1'}</strong></span>
            <span className="text-slate-600">|</span>
            <span>Jornada: <strong className="text-slate-200">{jornada || 'Simple'}</strong></span>
          </div>
        </div>
      </div>

      {origen && !projectorMode && (
        <p className="text-xs text-slate-400 italic line-clamp-1 mb-2">
          Origen: <span className="text-slate-300">{origen}</span>
        </p>
      )}

      {etiqueta_normativa && (
        <div className="mb-2.5">
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${
            etiqueta_normativa.includes('Desafectada')
              ? 'bg-rose-950/80 text-rose-300 border-rose-800'
              : etiqueta_normativa.includes('Incluida')
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
              : 'bg-indigo-950/80 text-indigo-300 border-indigo-800'
          }`}>
            <ShieldAlert className="w-3 h-3" />
            {etiqueta_normativa}
          </span>
        </div>
      )}

      {/* Indicador del concurso en el que se asignó */}
      {(estado === 'asignada' || estado === 'reservada') && concurso_asignacion && (
        <div className="mb-2">
          {concurso_asignacion === 'traslado' ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-500/60 shadow-sm">
              <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" />
              Concurso de Traslado Definitivo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/60 shadow-sm">
              <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
              Concurso de Ingreso a la Docencia
            </span>
          )}
        </div>
      )}

      {(estado === 'asignada' || estado === 'reservada') && (
        <div className={`mt-2 p-2.5 rounded-lg border flex flex-col gap-1.5 ${
          estado === 'asignada' ? 'bg-amber-950/40 border-amber-600/40 text-amber-100' : 'bg-rose-950/40 border-rose-600/40 text-rose-100'
        }`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <User className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Titular:</span>
              <span className={`font-mono font-bold truncate ${projectorMode ? 'text-lg text-white' : 'text-sm text-slate-100'}`}>
                {titular_nombre || 'Adjudicado (Sin nombre)'}
              </span>
            </div>
            {titular_dni && (
              <span className="text-xs font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700 flex-shrink-0">
                DNI: {titular_dni}
              </span>
            )}
          </div>

          {(reserva_nombre || estado === 'reservada') && (
            <div className="flex items-center justify-between gap-2 border-t border-rose-800/40 pt-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <UserCheck className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-rose-300">Reserva:</span>
                <span className={`font-mono font-bold truncate ${projectorMode ? 'text-lg text-white' : 'text-sm text-slate-100'}`}>
                  {reserva_nombre || 'En reserva'}
                </span>
              </div>
              {reserva_dni && (
                <span className="text-xs font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700 flex-shrink-0">
                  DNI: {reserva_dni}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {adminMode && (
        <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
          <span className="text-xs text-slate-400 font-medium">Acción rápida:</span>
          <div className="flex items-center gap-2 flex-wrap">
            {estado === 'disponible' && (
              <button
                onClick={() => onQuickAction && onQuickAction(cargo, 'asignar')}
                className="flex-1 sm:flex-none px-3.5 py-2.5 sm:px-2.5 sm:py-1 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm"
              >
                Adjudicar Titular
              </button>
            )}
            {estado === 'asignada' && (
              <>
                {concurso_asignacion === 'traslado' ? (
                  <span className="text-[11px] font-semibold text-sky-300 bg-sky-950/80 px-2.5 py-2 sm:px-2 sm:py-1 rounded border border-sky-800">
                    Sin reserva (Traslado)
                  </span>
                ) : (
                  <button
                    onClick={() => onQuickAction && onQuickAction(cargo, 'reservar')}
                    className="flex-1 sm:flex-none px-3.5 py-2.5 sm:px-2.5 sm:py-1 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-sm"
                  >
                    Tomar Reserva
                  </button>
                )}
                <button
                  onClick={() => onQuickAction && onQuickAction(cargo, 'liberar')}
                  className="px-3.5 py-2.5 sm:px-2 sm:py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  Liberar
                </button>
              </>
            )}
            {estado === 'reservada' && (
              <button
                onClick={() => onQuickAction && onQuickAction(cargo, 'liberar')}
                className="flex-1 sm:flex-none px-3.5 py-2.5 sm:px-2.5 sm:py-1 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-600/50 transition-colors"
              >
                Volver a Disponible
              </button>
            )}
            {estado === 'no_habilitada' && (
              <button
                onClick={() => onQuickAction && onQuickAction(cargo, 'habilitar')}
                className="flex-1 sm:flex-none px-3.5 py-2.5 sm:px-2 sm:py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                Habilitar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
