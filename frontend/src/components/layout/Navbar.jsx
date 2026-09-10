import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../stores/useSessionStore';
import { supabase } from '../../services/supabaseClient';

export default function Navbar() {
  const { company, profiles, currentProfile, fetchProfiles, setCurrentProfile } =
    useSessionStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (profiles.length === 0) fetchProfiles().catch(() => {});
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('fishsinu_token');
    navigate('/login');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-slate-800 lg:hidden">
          FishSinu
        </h1>
        <span className="hidden text-sm text-slate-500 md:block">
          {company?.business_name || 'Configura tu empresa'}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {company && (
          <span className="hidden text-sm text-slate-500 sm:block">NIT: {company.tax_id}</span>
        )}
        <label className="flex items-center gap-2 text-sm text-slate-500">
          <span>Cajero:</span>
          <select
            className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
            value={currentProfile?.id || ''}
            onChange={(e) => {
              const profile = profiles.find((p) => p.id === e.target.value);
              if (profile) setCurrentProfile(profile);
            }}
          >
            {profiles.length === 0 && <option value="">Sin perfil</option>}
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} · {p.role}
              </option>
            ))}
          </select>
        </label>

        {/* === BOTÓN DE SALIR === */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Salir
        </button>
        // ==========================
      </div>
    </header>
  );
}