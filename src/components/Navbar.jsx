import React from 'react';
import { useCargos } from '../context/CargosContext';
import { 
  Tv, 
  TvMinimal, 
  Radio, 
  Volume2, 
  VolumeX
} from 'lucide-react';

export function Navbar({ 
  projectorMode, 
  onToggleProjector,
  soundEnabled,
  onToggleSound,
  currentRoute = '/',
  onNavigate
}) {
  const { isRealtimeConnected, usingSupabase } = useCargos();

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    onToggleProjector();
  };

  return (
    <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-xl transition-all duration-300 ${
      projectorMode 
        ? 'bg-slate-950/95 border-amber-500/30 py-2.5' 
        : 'bg-slate-900/90 border-slate-800 py-3'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Logo ACHABI en la esquina y Cabecera */}
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/logo-achabi.png"
            alt="Logo ACHABI - Asociación Chaqueña de Bibliotecarios"
            className="w-16 h-16 rounded-full object-cover shadow-lg shadow-sky-600/30 flex-shrink-0 bg-white ring-2 ring-sky-400/40"
          />
          <div className="min-w-0">
            <span className="font-extrabold tracking-tight text-white text-sm sm:text-base lg:text-lg block truncate">
              ACHABI - PIZARRA DIGITAL DE CONCURSOS BIBLIOTECARIOS
            </span>
            <p className="text-xs text-slate-300 truncate">
              Ascensos, Traslados, Reincorporaciones e Ingreso a la Docencia
            </p>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Indicador de Sincronización en Vivo (solo en Admin) */}
          {currentRoute !== '/' && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 border border-slate-700 text-slate-300">
              <span className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>
                {usingSupabase ? 'En vivo (Supabase)' : 'En vivo (Red Local)'}
              </span>
            </div>
          )}

          {/* Botón de Sonido */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Silenciar notificaciones sonoras' : 'Activar sonido'}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Botón Modo Proyector */}
          <button
            onClick={toggleFullScreen}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shadow-md ${
              projectorMode
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 ring-2 ring-amber-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
            }`}
            title="Optimizar para proyección a gran distancia"
          >
            {projectorMode ? (
              <>
                <TvMinimal className="w-4 h-4" />
                <span className="hidden sm:inline">Salir de Proyector</span>
              </>
            ) : (
              <>
                <Tv className="w-4 h-4 text-amber-400" />
                <span>Modo Proyector</span>
              </>
            )}
          </button>

          {/* Enlace de regreso desde Admin a Pizarra Pública */}
          {currentRoute !== '/' && (
            <button
              onClick={() => onNavigate && onNavigate('/')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Pizarra Pública</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
