import { useEffect } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';

export default function Navbar() {
  const { company, profiles, currentProfile, fetchProfiles, setCurrentProfile } =
    useSessionStore();

  useEffect(() => {
    if (profiles.length === 0) fetchProfiles().catch(() => {});
  }, []);

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

      <div className="flex items-center gap-3">
        {company && (
          <span className="hidden text-sm text-slate-500 sm:block">{company.tax_id}</span>
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
      </div>
    </header>
  );
}
