import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { formatCurrency, formatDate } from '../lib/formatters'; // Ajusta la ruta si es lib/formatters

// Importamos los servicios de API directamente (ajusta la ruta según tu estructura)
import { creditAccountApi, paymentApi } from '../services/api'; 

export default function CreditAccountDetailPage() {
  const { accountId } = useParams();
  const [account, setAccount] = useState(null);
  const [payments, setPayments] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar cuenta, pagos y cliente
      const accRes = await creditAccountApi.get(accountId);
      setAccount(accRes.data);
      
      const payRes = await paymentApi.list({ credit_account_id: accountId });
      setPayments(payRes.data || []);

      if (accRes.data?.customer_id) {
        const custRes = await customerApi.get(accRes.data.customer_id);
        setCustomer(custRes.data);
      }
    } catch (err) {
      console.error("Error cargando cuenta:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [accountId]);

  const handleAddPayment = async () => {
    const { value: amount } = await Swal.fire({
      title: 'Registrar Abono',
      text: `Saldo pendiente: ${formatCurrency(account?.balance || 0)}`,
      input: 'number',
      inputLabel: 'Monto del abono (COP)',
      inputPlaceholder: 'Ej: 50000',
      showCancelButton: true,
      confirmButtonText: 'Abonar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0d9488',
      cancelButtonColor: '#64748b',
      inputValidator: (value) => {
        if (!value || value <= 0) return 'Escribe un monto válido';
        if (Number(value) > Number(account?.balance)) return 'El abono no puede ser mayor al saldo';
      }
    });

    if (amount) {
      try {
        await paymentApi.create({
          credit_account_id: accountId,
          amount: String(amount),
          payment_type: 'CASH', // Por defecto en efectivo
          payment_date: new Date().toISOString().slice(0, 10)
        });
        Swal.fire({
          icon: 'success',
          title: '¡Abono registrado!',
          text: 'El saldo ha sido actualizado.',
          confirmButtonColor: '#0d9488',
          timer: 1500
        });
        loadData(); // Recargar datos
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.userMessage || err.message || 'No se pudo registrar el abono.',
          confirmButtonColor: '#0d9488'
        });
      }
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando cuenta...</div>;
  if (!account) return <div className="p-8 text-center text-red-500">No se encontró la cuenta.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Cuenta de Crédito</h2>
          <Link to="/credit-accounts" className="text-sm text-sky-600 hover:underline">
            ← Volver a cuentas
          </Link>
        </div>
        <Button variant="success" onClick={handleAddPayment}>
          + Registrar Abono
        </Button>
      </div>

      {/* Resumen de la Cuenta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500 uppercase">Cliente</p>
          <p className="text-lg font-bold text-slate-800 mt-1">{customer?.name || '—'}</p>
          <p className="text-sm text-slate-500">Doc: {customer?.tax_id || '—'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 uppercase">Saldo Pendiente</p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">
            {formatCurrency(account.balance)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 uppercase">Estado</p>
          <div className="mt-1">
            <Badge color={account.status === 'ACTIVE' ? 'amber' : account.status === 'PAID' ? 'green' : 'red'}>
              {account.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-2">Límite: {formatCurrency(account.credit_limit)}</p>
        </Card>
      </div>

      {/* Historial de Abonos */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-700">Historial de Abonos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3">Referencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(p.payment_date)}</td>
                    <td className="px-4 py-3 font-semibold text-green-600">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3">{p.payment_type}</td>
                    <td className="px-4 py-3 text-slate-500">{p.reference || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    Aún no se han registrado abonos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}