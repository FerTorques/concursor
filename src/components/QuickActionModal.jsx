import React, { useState, useEffect, useRef } from 'react';
import { User, UserCheck, X, Check } from 'lucide-react';

export function QuickActionModal({
  isOpen,
  cargo,
  actionType,
  onClose,
  onConfirm
}) {
  const [nombre, setNombre] = useState('');
  const [dni, setDni] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (cargo && isOpen) {
      setNombre(actionType === 'asignar' ? cargo.titular_nombre || '' : cargo.reserva_nombre || '');
      setDni(actionType === 'asignar' ? cargo.titular_dni || '' : cargo.reserva_dni || '');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [cargo, isOpen, actionType]);

  if (!isOpen || !cargo) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    onConfirm({
      cargoId: cargo.id,
      actionType,
      nombre: nombre.trim(),
      dni: dni.trim()
    });
    onClose();
  };

  const isAsignar = actionType === 'asignar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className={`relative w-full max-w-md bg-slate-900 border rounded-2xl shadow-2xl p-6 ${
        isAsignar ? 'border-amber-500/80' : 'border-rose-500/80'
      }`}>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isAsignar ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isAsignar ? <User className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">
                {isAsignar ? 'Asignar Titular (1° Aspirante)' : 'Registrar Reserva (2° Aspirante)'}
              </h3>
              <p className="text-xs text-slate-400">
                Orden <strong className="text-white font-mono">N° {cargo.orden}</strong> • {cargo.nombre}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Nombre y Apellido del Aspirante
            </label>
            <input
              ref={inputRef}
              type="text"
              placeholder="Ej. Gómez, María Laura"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              D.N.I. (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. 28.450.912"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg ${
                isAsignar
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/40'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              {isAsignar ? 'Confirmar Asignación' : 'Completar Reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
