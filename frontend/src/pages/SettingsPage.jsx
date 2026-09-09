import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useSessionStore } from '../stores/useSessionStore';
import { companyApi, profileApi } from '../services/api';

export default function SettingsPage() {
  const { company, fetchCompany, profiles, fetchProfiles } = useSessionStore();

  // Company settings
  const [form, setForm] = useState({
    business_name: '',
    tax_id: '',
    address: '',
    email: '',
    phone: '',
    currency: 'PEN',
    invoice_prefix: 'F001',
    logo_url: '',
  });
  const [savingCompany, setSavingCompany] = useState(false);

  // Profiles
  const [newProfile, setNewProfile] = useState({
    full_name: '',
    role: 'cashier',
    is_active: true,
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    fetchCompany().catch(() => {});
    fetchProfiles().catch(() => {});
  }, []);

  useEffect(() => {
    if (company) {
      setForm({
        business_name: company.business_name || '',
        tax_id: company.tax_id || '',
        address: company.address || '',
        email: company.email || '',
        phone: company.phone || '',
        currency: company.currency || 'PEN',
        invoice_prefix: company.invoice_prefix || 'F001',
        logo_url: company.logo_url || '',
      });
    }
  }, [company]);

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setSavingCompany(true);
    try {
      await companyApi.update({
        business_name: form.business_name,
        tax_id: form.tax_id,
        address: form.address || null,
        email: form.email || null,
        phone: form.phone || null,
        currency: form.currency,
        invoice_prefix: form.invoice_prefix,
        logo_url: form.logo_url || null,
      });
      await fetchCompany();
      alert('Configuración de empresa guardada.');
    } catch (err) {
      alert(err.userMessage || err.message);
    } finally {
      setSavingCompany(false);
    }
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      await profileApi.create({ id, ...newProfile });
      await fetchProfiles();
      setNewProfile({ full_name: '', role: 'cashier', is_active: true });
      alert('Perfil creado.');
    } catch (err) {
      alert(err.userMessage || err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateProfileActive = async (profile) => {
    try {
      await profileApi.update(profile.id, { is_active: !profile.is_active });
      await fetchProfiles();
    } catch (err) {
      alert(err.userMessage || err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Configuración</h2>
        <p className="text-sm text-slate-500">Datos de la empresa y perfiles del sistema.</p>
      </div>

      <Card className="p-4">
        <h3 className="mb-4 text-lg font-semibold text-slate-700">
          Datos de la empresa
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Razón social"
            value={form.business_name}
            onChange={(e) => setForm({ ...form, business_name: e.target.value })}
            required
          />
          <Input
            label="RUC / Tax ID"
            value={form.tax_id}
            onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
            required
          />
          <Input
            label="Dirección"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Teléfono"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Moneda"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              <option value="PEN">PEN — Sol</option>
              <option value="USD">USD — Dólar</option>
            </Select>
            <Input
              label="Prefijo factura"
              value={form.invoice_prefix}
              onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSaveCompany} disabled={savingCompany}>
            {savingCompany ? 'Guardando...' : 'Guardar datos empresa'}
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-lg font-semibold text-slate-700">Perfiles de usuario</h3>

        <div className="mb-4 grid grid-cols-1 gap-3 border-b border-slate-100 pb-4 md:grid-cols-4">
          <Input
            label="Nombre completo"
            value={newProfile.full_name}
            onChange={(e) =>
              setNewProfile({ ...newProfile, full_name: e.target.value })
            }
          />
          <Select
            label="Rol"
            value={newProfile.role}
            onChange={(e) => setNewProfile({ ...newProfile, role: e.target.value })}
          >
            <option value="cashier">Cajero</option>
            <option value="admin">Administrador</option>
            <option value="accountant">Contador</option>
          </Select>
          <Button
            variant="secondary"
            className="mt-6"
            onClick={handleCreateProfile}
            disabled={savingProfile}
          >
            {savingProfile ? 'Creando...' : '+ Crear perfil'}
          </Button>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Rol</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td className="px-3 py-2 font-medium">{profile.full_name}</td>
                <td className="px-3 py-2">{profile.role}</td>
                <td className="px-3 py-2">
                  {profile.is_active ? (
                    <span className="text-emerald-600">Activo</span>
                  ) : (
                    <span className="text-rose-600">Inactivo</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUpdateProfileActive(profile)}
                  >
                    {profile.is_active ? 'Desactivar' : 'Activar'}
                  </Button>
                </td>
              </tr>
            ))}
            {profiles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                  No hay perfiles. Crea el primero para poder operar en el POS.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
