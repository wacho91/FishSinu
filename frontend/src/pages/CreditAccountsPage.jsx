import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import CreditAccountModal from '../components/credits/CreditAccountModal';
import { useCatalogStore } from '../stores/useCatalogStore';

export default function CreditAccountsPage() {
  const {
    creditAccounts,
    customers,
    loading,
    error,
    fetchCreditAccounts,
    fetchCustomers,
    createCreditAccount,
    deleteCreditAccount,
  } = useCatalogStore();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchCreditAccounts().catch(() => {});
    fetchCustomers().catch(() => {});
  }, []);

  const customerName = (id) => customers.find((c) => c.id === id)?.name || `Cliente #${id}`;

  const filtered = filter
    ? creditAccounts.filter((ca) => ca.status === filter)
    : creditAccounts;

  const handleSubmit = async (payload) => {
    try {
      await createCreditAccount(payload);
      await fetchCreditAccounts();
      setOpen(false);
    } catch (err) {
      alert(err.userMessage || err.message);
    }
  };

  const handleDelete = async (ca) => {
    if (!window.confirm(`¿Eliminar cuenta de crédito del cliente #${ca.customer_id}?`)) return;
    try {
      await deleteCreditAccount(ca.id);
    } catch (err) {
      alert(err.userMessage || err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Cuentas de crédito</h2>
          <p className="text-sm text-slate-500">Cuentas por cobrar y límites de crédito.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          + Nueva cuenta de crédito
        </Button>
      </div>

      {error && <div className="rounded-md bg-rose-50 px-3 py-2 text-rose-700">{error}</div>}

      <div className="flex gap-2">
        {['', 'ACTIVE', 'BLOCKED', 'PAID'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setFilter(s)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              filter === s
                ? 'bg-sky-600 text-white'
                : 'bg-white text-slate-600 shadow-sm hover:bg-slate-100'
            }`}
          >
            {s || 'Todos'}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Límite</th>
                <th className="px-4 py-3">Saldo</th>
                <th className="px-4 py-3">Disponible</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((ca) => {
                const available = Number(ca.credit_limit) - Number(ca.balance);
                return (
                  <tr key={ca.id}>
                    <td className="px-4 py-3">
                      <Link
                        to={`/credit-accounts/${ca.id}`}
                        className="font-medium text-sky-600 hover:underline"
                      >
                        {customerName(ca.customer_id)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{Number(ca.credit_limit).toFixed(2)}</td>
                    <td className="px-4 py-3 font-medium">{Number(ca.balance).toFixed(2)}</td>
                    <td className="px-4 py-3">{available.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Badge
                        color={
                          ca.status === 'ACTIVE'
                            ? 'blue'
                            : ca.status === 'PAID'
                            ? 'green'
                            : 'red'
                        }
                      >
                        {ca.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link to={`/credit-accounts/${ca.id}`}>
                        <Button size="sm" variant="outline" className="mr-1">
                          Abonos
                        </Button>
                      </Link>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(ca)}>
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No hay cuentas de crédito registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <CreditAccountModal
        open={open}
        onClose={() => setOpen(false)}
        initial={editing}
        customers={customers}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
