import React, { useState } from 'react';
import { useCargos } from '../context/CargosContext';
import { Lock, Mail, Key, ShieldCheck, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';

export function AdminLogin({ onCancel, onLoginSuccess }) {
  const { loginAdmin, usingSupabase } = useCargos();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginAdmin(email, password);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      console.error('Error de autenticación:', err);
      setError(err.message || 'Credenciales inválidas. Revisa el correo y la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('admin@chaco.gob.ar');
    setPassword('concurso2026');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow decorativo */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-sky-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          {/* Botón de regreso */}
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la Pizarra Pública
          </button>

          {/* Icono y Título */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-sky-600/30">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Acceso a Mesa de Control
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Concurso de Traslados y Reincorporaciones N° 55 e Ingreso N° 47
            </p>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@chaco.gob.ar"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-black text-sm bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-lg shadow-sky-950/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Ingresar a Panel Administrador
                </>
              )}
            </button>
          </form>

          {/* Atajo rápido de acceso en modo local / demo */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center justify-center gap-1.5 mx-auto font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Cargar credenciales de prueba ({usingSupabase ? 'Supabase Auth' : 'Demo Local'})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
