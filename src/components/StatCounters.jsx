import React from 'react';
import { useCargos } from '../context/CargosContext';
import { CheckCircle2, Clock, CheckCheck, Ban } from 'lucide-react';

export function StatCounters({ projectorMode = false }) {
  const { stats } = useCargos();

  const items = [
    {
      key: 'disponibles',
      label: 'Disponibles',
      count: stats.disponibles,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: CheckCircle2,
      badgeText: 'Habilitadas para asignación'
    },
    {
      key: 'asignadas',
      label: 'Adjudicadas',
      count: stats.asignadas,
      color: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      icon: Clock,
      badgeText: '1° aspirante / Admite reserva'
    },
    {
      key: 'reservadas',
      label: 'Completas / Reservadas',
      count: stats.reservadas,
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      icon: CheckCheck,
      badgeText: 'Vacante completa con 2° aspirante'
    },
    {
      key: 'noHabilitadas',
      label: 'No Habilitadas',
      count: stats.noHabilitadas,
      color: 'bg-slate-500/10 text-slate-400 border-slate-600/30',
      icon: Ban,
      badgeText: 'Desafectadas RES-2026-4798'
    }
  ];

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${projectorMode ? 'text-lg' : 'text-sm'}`}>
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
            <span className={`font-mono font-extrabold ml-2 flex-shrink-0 ${projectorMode ? 'text-3xl' : 'text-2xl'}`}>
              {item.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
