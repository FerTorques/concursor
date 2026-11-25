import React, { useState, useEffect } from 'react';
import { useCargos } from '../context/CargosContext';
import { 
  X, 
  MapPin, 
  User, 
  UserCheck, 
  Clock, 
  ShieldAlert, 
  Ban, 
  CheckCircle2,
  Save,
  ArrowRightLeft,
  GraduationCap
} from 'lucide-react';

export function CargoDetailModal({ 
  cargo, 
  isOpen, 
  onClose, 
  isAdmin = false,
  onSave
}) {
  const { activeConcurso } = useCargos();
  const [estado, setEstado] = useState('disponible');
  const [concursoAsignacion, setConcursoAsignacion] = useState('traslado');
  const [titularNombre, setTitularNombre] = useState('');
  const [titularDni, setTitularDni] = useState('');
  const [reservaNombre, setReservaNombre] = useState('');
  const [reservaDni, setReservaDni] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Sincronizar estado local al abrir o cambiar de cargo
  useEffect(() => {
    if (cargo) {
      setEstado(cargo.estado || 'disponible');
      setConcursoAsignacion(cargo.concurso_asignacion || activeConcurso || 'traslado');
      setTitularNombre(cargo.titular_nombre || '');
      setTitularDni(cargo.titular_dni || '');
      setReservaNombre(cargo.reserva_nombre || '');
      setReservaDni(cargo.reserva_dni || '');
      setObservaciones(cargo.observaciones || '');
    }
  }, [cargo, activeConcurso]);

  if (!isOpen || !cargo) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      let finalEstado = estado;
      const hasTitular = titularNombre.trim() !== '' || titularDni.trim() !== '';
      const hasReserva = (reservaNombre.trim() !== '' || reservaDni.trim() !== '') && concursoAsignacion !== 'traslado';

      if (finalEstado === 'disponible' && (hasTitular || hasReserva)) {
        finalEstado = hasReserva ? 'reservada' : 'asignada';
      } else if (finalEstado === 'asignada' && hasReserva) {
        finalEstado = 'reservada';
      }

      const clearApplicants = finalEstado === 'disponible';
      const isTraslado = concursoAsignacion === 'traslado';
      onSave(cargo.id, {
        estado: finalEstado,
        concurso_asignacion: clearApplicants ? null : concursoAsignacion,
        titular_nombre: clearApplicants
          ? ''
          : (titularNombre.trim() || (finalEstado !== 'no_habilitada' ? 'Aspirante Titular' : '')),
        titular_dni: clearApplicants ? '' : titularDni.trim(),
        reserva_nombre: (clearApplicants || isTraslado) ? '' : reservaNombre.trim(),
        reserva_dni: (clearApplicants || isTraslado) ? '' : reservaDni.trim(),
        observaciones: observaciones.trim()
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Cabecera */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-3">
            <span className="font-mono font-black text-xl px-3 py-1 rounded-lg bg-sky-600 text-white">
              N° {cargo.orden}
            </span>
            <div>
              <h2 className="text-lg font-bold text-white line-clamp-1">
                {cargo.nombre}
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {cargo.region}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Ficha técnica */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-800 text-sm">
            <div>
              <span className="text-xs text-slate-400 block font-medium">B.P. N°</span>
              <span className="font-mono font-bold text-sky-400">{cargo.bp || 'S/N'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Categoría</span>
              <span className="font-bold text-white">{cargo.cat || '1ª'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Modalidad</span>
              <span className="font-bold text-white">{cargo.mod || 'Pública'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Zona</span>
              <span className="font-bold text-white">{cargo.zona || 'ZU 1'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Jornada</span>
              <span className="font-bold text-white">{cargo.jornada || 'Simple'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Localidad</span>
              <span className="font-bold text-rose-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {cargo.localidad}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-slate-400 block font-medium">Región Educativa</span>
              <span className="font-semibold text-slate-200 text-xs truncate block">{cargo.region}</span>
            </div>
          </div>

          {cargo.origen && (
            <div className="p-3.5 bg-slate-800/30 rounded-xl border border-slate-800/80">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Origen de la Vacante:
              </span>
              <p className="text-sm text-slate-200 italic font-mono">
                {cargo.origen}
              </p>
            </div>
          )}

          {cargo.etiqueta_normativa && (
            <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 ${
              cargo.etiqueta_normativa.includes('Desafectada')
                ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
            }`}>
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold uppercase block">Normativa Aplicada</span>
                <span className="text-sm font-semibold">{cargo.etiqueta_normativa}</span>
              </div>
            </div>
          )}

          {!isAdmin && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border bg-slate-800/30 border-slate-800">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-bold block mb-2">
                  Estado de la vacante:
                </span>
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wider border ${
                  cargo.estado === 'disponible'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                    : cargo.estado === 'asignada'
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : cargo.estado === 'reservada'
                    ? 'bg-rose-600 text-white border-rose-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {cargo.estado === 'disponible' && <CheckCircle2 className="w-4 h-4" />}
                  {cargo.estado === 'asignada' && <Clock className="w-4 h-4" />}
                  {cargo.estado === 'reservada' && <UserCheck className="w-4 h-4" />}
                  {cargo.estado === 'no_habilitada' && <Ban className="w-4 h-4" />}
                  {cargo.estado}
                </span>

                {cargo.concurso_asignacion && (
                  <div className="mt-2.5">
                    {cargo.concurso_asignacion === 'traslado' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-sky-950 text-sky-300 border border-sky-500/50">
                        <ArrowRightLeft className="w-4 h-4 text-sky-400" />
                        Asignado en: 1° Concurso de Traslado Definitivo (Sin reservas)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-purple-950 text-purple-300 border border-purple-500/50">
                        <GraduationCap className="w-4 h-4 text-purple-400" />
                        Asignado en: 2° Concurso de Ingreso a la Docencia (Admite reserva)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {(cargo.titular_nombre || cargo.estado === 'asignada' || cargo.estado === 'reservada') && (
                <div className="p-4 rounded-xl border bg-amber-950/20 border-amber-800/40 space-y-3">
                  <div className="flex items-center gap-2 text-amber-300">
                    <User className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">1° Aspirante (Titular Asignado):</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-xs text-slate-400 block">Nombre Completo</span>
                      <span className="font-mono font-bold text-white">{cargo.titular_nombre || 'Asignado'}</span>
                    </div>
                    {cargo.titular_dni && (
                      <div>
                        <span className="text-xs text-slate-400 block">DNI</span>
                        <span className="font-mono text-slate-200">{cargo.titular_dni}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(cargo.reserva_nombre || cargo.estado === 'reservada') && (
                <div className="p-4 rounded-xl border bg-rose-950/20 border-rose-800/40 space-y-3">
                  <div className="flex items-center gap-2 text-rose-300">
                    <UserCheck className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">2° Aspirante (Reserva):</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-xs text-slate-400 block">Nombre Completo</span>
                      <span className="font-mono font-bold text-white">{cargo.reserva_nombre || 'En Reserva'}</span>
                    </div>
                    {cargo.reserva_dni && (
                      <div>
                        <span className="text-xs text-slate-400 block">DNI</span>
                        <span className="font-mono text-slate-200">{cargo.reserva_dni}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {isAdmin && (
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              {/* Selector de Concurso para esta adjudicación */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-800/40 border border-slate-700/80">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  Concurso de Adjudicación:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setConcursoAsignacion('traslado');
                      if (estado === 'reservada') setEstado('asignada');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      concursoAsignacion === 'traslado'
                        ? 'bg-sky-600 text-white border-sky-400 shadow-md ring-2 ring-sky-400/40'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    1° Traslado Definitivo (Sin reservas)
                  </button>

                  <button
                    type="button"
                    onClick={() => setConcursoAsignacion('ingreso')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      concursoAsignacion === 'ingreso'
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md ring-2 ring-purple-400/40'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    2° Ingreso a la Docencia (Con reservas)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  Cambiar Estado del Cargo:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEstado('disponible');
                      setTitularNombre('');
                      setTitularDni('');
                      setReservaNombre('');
                      setReservaDni('');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      estado === 'disponible'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md ring-2 ring-emerald-400/50'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    Disponible
                  </button>

                  <button
                    type="button"
                    onClick={() => setEstado('asignada')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      estado === 'asignada'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-400/50'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    Asignada (1° Asp.)
                  </button>

                  <button
                    type="button"
                    disabled={concursoAsignacion === 'traslado'}
                    onClick={() => setEstado('reservada')}
                    title={concursoAsignacion === 'traslado' ? 'En Traslado Definitivo no se admiten reservas' : 'Asignar 2° aspirante en reserva'}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      concursoAsignacion === 'traslado'
                        ? 'bg-slate-800/40 text-slate-500 border-slate-800 cursor-not-allowed opacity-50'
                        : estado === 'reservada'
                        ? 'bg-rose-600 text-white border-rose-400 shadow-md ring-2 ring-rose-400/50'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    Reservada (Completa)
                  </button>

                  <button
                    type="button"
                    onClick={() => setEstado('no_habilitada')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      estado === 'no_habilitada'
                        ? 'bg-slate-600 text-white border-slate-400 shadow-md ring-2 ring-slate-400/50'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    No Habilitada
                  </button>
                </div>
                {concursoAsignacion === 'traslado' && (
                  <p className="text-[11px] text-sky-400 italic">
                    * En el Concurso de Traslado Definitivo no se admiten reservas. El cargo queda cubierto con el titular.
                  </p>
                )}
              </div>

              {/* Titular */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/30 space-y-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  1° Aspirante — Titular:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Nombre y Apellido</label>
                    <input
                      type="text"
                      placeholder="Ej. Gómez, María Laura"
                      value={titularNombre}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTitularNombre(val);
                        if (val.trim() !== '' && estado === 'disponible') {
                          setEstado('asignada');
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">DNI (opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. 28.450.912"
                      value={titularDni}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTitularDni(val);
                        if (val.trim() !== '' && estado === 'disponible') {
                          setEstado('asignada');
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Reserva */}
              {concursoAsignacion === 'traslado' ? (
                <div className="p-3.5 rounded-xl border border-sky-800/40 bg-sky-950/20 text-xs text-sky-300 flex items-center gap-2">
                  <Ban className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  <span>
                    <strong>Sin Reserva:</strong> Los cargos adjudicados en <em>Traslado Definitivo</em> están excluidos de reservas de aspirantes (Ley 647-E).
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/30 space-y-3">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                    2° Aspirante — En Reserva (Ingreso):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Nombre y Apellido</label>
                      <input
                        type="text"
                        placeholder="Ej. Benítez, Clara Inés"
                        value={reservaNombre}
                        onChange={(e) => {
                          const val = e.target.value;
                          setReservaNombre(val);
                          if (val.trim() !== '' && (estado === 'disponible' || estado === 'asignada')) {
                            setEstado('reservada');
                          }
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">DNI (opcional)</label>
                      <input
                        type="text"
                        placeholder="Ej. 33.204.887"
                        value={reservaDni}
                        onChange={(e) => {
                          const val = e.target.value;
                          setReservaDni(val);
                          if (val.trim() !== '' && (estado === 'disponible' || estado === 'asignada')) {
                            setEstado('reservada');
                          }
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-slate-400 block mb-1">Observaciones del Acto</label>
                <input
                  type="text"
                  placeholder="Detalles sobre la asignación..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold rounded-xl bg-sky-600 hover:bg-sky-500 text-white transition-colors flex items-center gap-2 shadow-lg shadow-sky-900/40"
                >
                  <Save className="w-4 h-4" />
                  Guardar Cambios
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
