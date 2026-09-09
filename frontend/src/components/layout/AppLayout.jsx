import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useSessionStore } from '../../stores/useSessionStore';
import { useCatalogStore } from '../../stores/useCatalogStore';

export default function AppLayout() {
  const fetchCompany = useSessionStore((s) => s.fetchCompany);
  const loadAllBaseCatalog = useCatalogStore((s) => s.loadAllBaseCatalog);

  useEffect(() => {
    fetchCompany().catch(() => {});
    loadAllBaseCatalog().catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="flex-1 p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
