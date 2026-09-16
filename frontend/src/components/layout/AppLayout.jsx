import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Spinner from '../ui/Spinner'; // <-- Importamos nuestro componente global
import { useSessionStore } from '../../stores/useSessionStore';
import { useCatalogStore } from '../../stores/useCatalogStore';

export default function AppLayout() {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const fetchCompany = useSessionStore((s) => s.fetchCompany);
  const loadAllBaseCatalog = useCatalogStore((s) => s.loadAllBaseCatalog);

  useEffect(() => {
    fetchCompany().catch(() => {});
    loadAllBaseCatalog().catch(() => {});
  }, []);

  // === INTERCEPTOR DE RUTAS ===
  // Cada vez que la URL cambia (haces clic en el menú), mostramos el logo 500ms
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 500);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);
  // ==============================

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="flex-1 p-5 relative">
          {/* Si está cambiando de ruta, muestra el logo. Si no, muestra el módulo */}
          {isTransitioning ? (
            <Spinner fullContent />
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}