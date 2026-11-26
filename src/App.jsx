import React, { useState, useEffect } from 'react';
import { CargosProvider } from './context/CargosContext';
import { PublicBoard } from './pages/PublicBoard';
import { AdminDashboard } from './pages/AdminDashboard';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Escuchar navegación del navegador (atrás/adelante)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <CargosProvider>
      <div className="min-h-screen flex flex-col bg-slate-950">
        <div className="flex-1">
          {currentPath.startsWith('/admin') ? (
            <AdminDashboard onNavigate={navigate} />
          ) : (
            <PublicBoard onNavigate={navigate} />
          )}
        </div>
        <footer className="border-t border-slate-800/80 bg-slate-950/90 py-4 px-4 text-center text-xs text-slate-400">
          Desarrollado por: <span className="text-slate-200 font-semibold">Fernando Acevedo (ACHABI)</span> - Contacto:{' '}
          <a
            href="mailto:fertorques@gmail.com"
            className="text-sky-400 hover:text-sky-300 underline underline-offset-2 transition-colors"
          >
            fertorques@gmail.com
          </a>{' '}
          - Asociación Chaqueña de Bibliotecarios
        </footer>
      </div>
    </CargosProvider>
  );
}
