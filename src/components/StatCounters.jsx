import React from 'react';
import { useCargos } from '../context/CargosContext';
import { CheckCircle2, ArrowRightLeft, GraduationCap } from 'lucide-react';

export function StatCounters({ projectorMode = false }) {
  const { stats } = useCargos();

  const items = [
    {
      key: 'disponibles',
      label: 'Disponibles',
      count: stats.disponibles,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: CheckCircle2,
      badgeText: 'Vacantes libres para adjudicar'
    },
    {
      key: 'traslado',
      label: 'Traslado Definitivo',
      count: `${stats.asignadasTraslado} / ${stats.cupoMaximoTraslado}`,
      color: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
      icon: ArrowRightLeft,
      badgeText: stats.isCupoTrasladoAlcanzado
        ? '¡Cupo 50% completado!'
        : `Cupo máx. 50% (${stats.cupoRestanteTraslado} restan)`
    },
    {
      key: 'ingreso',
      label: 'Ingreso a la Docencia',
      count: stats.asignadasIngreso,
      color: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      icon: GraduationCap,
      badgeText: `${stats.reservadasIngreso} con reserva de vacante`
    }
  ];

  const porcentajeTraslado = stats.cupoMaximoTraslado > 0
    ? Math.min(100, Math.round((stats.asignadasTraslado / stats.cupoMaximoTraslado) * 100))
    : 0;

  return (
    <div className="space-y-2.5">
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${projectorMode ? 'text-lg' : 'text-sm'}`}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className={`flex items-center justify-between p-3 rounded-xl border backdrop-blur-md transition-all duration-200 ${item.color} shadow-sm`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-2 rounded-lg ${item.color} bg-opacity-30 flex-shrink-0`}>
                  <Icon className={projectorMode ? "w-6 h-6" : "w-5 h-5"} />
                </div>
                <div className="truncate">
                  <span className={`block font-semibold tracking-wide ${projectorMode ? 'text-base font-bold' : 'text-xs text-slate-300'}`}>
                    {item.label}
                  </span>
                  {!projectorMode && (
                    <span className="text-[11px] text-slate-400 block truncate">
                      {item.badgeText}
                    </span>
                  )}
                </div>
              </div>
              <span className={`font-mono font-extrabold ml-2 flex-shrink-0 ${projectorMode ? 'text-2xl' : 'text-xl'}`}>
                {item.count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Barra de progreso de cupo del 50% de Traslado Definitivo */}
      {!projectorMode && (
        <div className="p-2.5 px-3.5 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sky-400">Cupo Traslado Definitivo (50% max):</span>
            <span className="font-mono text-slate-300">
              <strong>{stats.asignadasTraslado}</strong> de <strong>{stats.cupoMaximoTraslado}</strong> cargos asignados ({porcentajeTraslado}%)
            </span>
          </div>
          <div className="flex items-center gap-2 flex-1 max-w-xs sm:ml-4">
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div 
                className={`h-full transition-all duration-500 ${
                  stats.isCupoTrasladoAlcanzado 
                    ? 'bg-amber-400' 
                    : 'bg-gradient-to-r from-sky-500 to-sky-400'
                }`}
                style={{ width: `${porcentajeTraslado}%` }}
              />
            </div>
            <span className="font-mono font-bold text-sky-300 text-[11px] min-w-[35px] text-right">
              {porcentajeTraslado}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
