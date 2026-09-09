import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import AbonoModal from '../components/credits/AbonoModal';
import { useCatalogStore } from '../stores/useCatalogStore';
import { paymentApi } from '../services/api';

export default function CreditAccountDetailPage() {
  const { accountId } = useParams();
  const { creditAccounts, customers, fetchCreditAccounts, fetchCustomers } = useCatalogStore();
  const [payments, setPayments] = useState([]);
  const [abonoOpen, setAbonoOpen] = useState(false);
  const account = creditAccounts.find((ca) => ca.id === Number(accountId));
  const customer = account
    ? customers.find((c) => c.id === account.customer_id)
    : null;

  useEffect(() => {
    if (!creditAccounts.length) fetchCreditAccounts().catch(() => {});
    if (!customers.length) fetchCustomers().catch(() => {});
    loadPayments();
  }, [accountId]);

  const loadPayments = async () => {
    try {
      const data = await paymentApi.list({ credit_account_id: accountId });
      setPayments(data);
    } catch (err) {
      alert(err.userMessage || err.message);
    }
  };

  const handleAbono = async (payload) => {
    try {
      await paymentApi.create(payload);
      await Promise.all([fetchCreditAccounts(), loadPayments()]);
      setAbonoOpen(false);
    } catch (err) {
      alert(err.userMessage || err.message);
    }
  };

  if (!account) {
    return (
      <div className="rounded-lg bg-white p-8 text-center text-slate-500">
        Cargando cuenta de crédito...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Cuenta de crédito — {customer?.name || `Cliente #${account.customer_id}`}
          </h2>
          <Link to="/credit-accounts" className="text-sm text-sky-600 hover:underline">
            ← Volver a cuentas
          </Link>
        </div>
        <Button variant="success" onClick={() => setAbonoOpen(true)}>
          + Registrar abono
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-slate-500">Límite de crédito</p>
          <p className="text-2xl font-semibold">{Number(account.credit_limit).toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Saldo pendiente</p>
          <p className="text-2xl font-semibold text-rose-600">
            {Number(account.balance).toFixed(2)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Estado</p>
          <p className="mt-1">
            <Badge
              color={
                account.status === 'ACTIVE'
                  ? 'blue'
                  : account.status === 'PAID'
                  ? 'green'
                  : 'red'
              }
            >
              {account.status}
            </Badge>
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 text-sm font-semibold text-slate-700">
          Historial de abonos / pagos
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Monto</th>
              <th className="px-4 py-3">Método</th>
              <th className="px-4 py-3">Referencia</th>
              <th className="px-4 py-3">Notas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">{new Date(p.payment_date).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-medium">{Number(p.amount).toFixed(2)}</td>
                <td className="px-4 py-3">{p.payment_type}</td>
                <td className="px-4 py-3">{p.reference || '—'}</td>
                <td className="px-4 py-3 text-slate-500">{p.notes || '—'}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No hay abonos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <AbonoModal
        open={abonoOpen}
        account={account}
        onClose={() => setAbonoOpen(false)}
        onSubmit={handleAbono}
      />
    </div>
  );
}
