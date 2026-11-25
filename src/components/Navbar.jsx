import React from 'react';
import { useCargos } from '../context/CargosContext';
import { 
  Tv, 
  TvMinimal, 
  Radio, 
  BookOpen, 
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
        {/* Marca y Título Oficial */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-sky-600/30 flex-shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold tracking-tight text-white text-base sm:text-lg truncate">
                Concurso Bibliotecario N° 55 y N° 47
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-sky-950 text-sky-400 border border-sky-800 uppercase tracking-wider">
                Ley 647-E Art. 266
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">
              Traslados, Reincorporaciones e Ingreso • Ministerio de Educación Chaco
            </p>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Indicador de Sincronización en Vivo */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 border border-slate-700 text-slate-300">
            <span className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>
              {usingSupabase ? 'En vivo (Supabase)' : 'En vivo (Red Local)'}
            </span>
          </div>

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
