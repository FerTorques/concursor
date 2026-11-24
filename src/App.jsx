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
      {currentPath.startsWith('/admin') ? (
        <AdminDashboard onNavigate={navigate} />
      ) : (
        <PublicBoard onNavigate={navigate} />
      )}
    </CargosProvider>
  );
}
