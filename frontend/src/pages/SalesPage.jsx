import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import CurrencyText from '../components/ui/CurrencyText';
import { useSalesStore } from '../stores/useSalesStore';
import { useSessionStore } from '../stores/useSessionStore';

export default function SalesPage() {
  const { sales, loading, error, fetchSales } = useSalesStore();
  const company = useSessionStore((s) => s.company);
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchSales().catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      if (status && s.status !== status) return false;
      return true;
    });
  }, [sales, status, startDate, endDate]);

  const applyFilters = () => {
    const params = {};
    if (status) params.status = status;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    fetchSales(params).catch(() => {});
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Ventas</h2>
          <p className="text-sm text-slate-500">Historial de ventas POS.</p>
        </div>
        <Link to="/pos">
          <Button>+ Nueva venta</Button>
        </Link>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <select
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Estado: todos</option>
            <option value="COMPLETED">Completadas</option>
            <option value="CANCELLED">Canceladas</option>
          </select>
          <input
            type="date"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Button variant="outline" onClick={applyFilters}>
            Aplicar filtros
          </Button>
        </div>
      </Card>

      {error && <div className="rounded-md bg-rose-50 px-3 py-2 text-rose-700">{error}</div>}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">N°</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Pago</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((sale) => (
                <tr key={sale.id}>
                  <td className="px-4 py-3 font-mono">#{sale.id}</td>
                  <td className="px-4 py-3">{sale.sale_date}</td>
                  <td className="px-4 py-3">Cliente #{sale.customer_id ?? '—'}</td>
                  <td className="px-4 py-3">{sale.payment_type}</td>
                  <td className="px-4 py-3">
                    <Badge color={sale.status === 'COMPLETED' ? 'green' : 'red'}>
                      {sale.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    <CurrencyText value={sale.total} currency={company?.currency} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/sales/${sale.id}`}>
                      <Button size="sm" variant="outline">
                        Ver detalle
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No hay ventas registradas.
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
