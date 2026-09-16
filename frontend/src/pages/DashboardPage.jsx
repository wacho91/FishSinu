import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import CurrencyText from '../components/ui/CurrencyText';
import Pagination from '../components/ui/Pagination'; // <-- Importamos la paginación
import { useSalesStore } from '../stores/useSalesStore';
import { useCatalogStore } from '../stores/useCatalogStore';
import { useInvoiceStore } from '../stores/useInvoiceStore';
import { useSessionStore } from '../stores/useSessionStore';

export default function DashboardPage() {
  const { sales, fetchSales } = useSalesStore();
  const { products, customers, fetchProducts, fetchCustomers } = useCatalogStore();
  const { invoices, fetchInvoices } = useInvoiceStore();
  const company = useSessionStore((s) => s.company);
  const currency = company?.currency || 'COP';

  // === ESTADOS PARA CRÉDITOS Y ABONOS ===
  const [creditAccounts, setCreditAccounts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [customersMap, setCustomersMap] = useState({});

  // === ESTADOS DE PAGINACIÓN DEL DASHBOARD ===
  const [payPage, setPayPage] = useState(1);
  const [salePage, setSalePage] = useState(1);
  const itemsPerPage = 3; // Solo 3 elementos por tarjeta para evitar scroll infinito
  // ==========================================

  useEffect(() => {
    fetchSales().catch(() => {});
    fetchProducts().catch(() => {});
    fetchCustomers().catch(() => {});
    fetchInvoices().catch(() => {});

    const token = localStorage.getItem('fishsinu_token');
    const headers = { Authorization: `Bearer ${token}` };

    // Cargar cuentas de crédito
    fetch('https://fishsinu.onrender.com
/api/v1/credit-accounts', { headers })
      .then(res => res.ok ? res.json() : [])
      .then(data => setCreditAccounts(data))
      .catch(() => {});

    // Cargar Abonos
    fetch('https://fishsinu.onrender.com
/api/v1/payments', { headers })
      .then(res => res.ok ? res.json() : [])
      .then(data => setPayments(data))
      .catch(() => {});

    // Mapear clientes para saber los nombres
    fetch('https://fishsinu.onrender.com
/api/v1/customers', { headers })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const map = {};
        data.forEach(c => map[c.id] = c.name);
        setCustomersMap(map);
      })
      .catch(() => {});
  }, []);

  const completedSales = sales.filter((s) => s.status === 'COMPLETED');

  const stats = useMemo(() => {
    // === FIX CONTABLE: Ingresos Reales = Contado + Abonos de Crédito ===
    const cashSales = completedSales
      .filter(s => s.payment_type !== 'CREDIT')
      .reduce((acc, s) => acc + Number(s.total), 0);
    
    const totalPayments = payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const realIncome = cashSales + totalPayments;
    // ==================================================================

    const totalCreditPending = creditAccounts.reduce((acc, account) => acc + Number(account.balance), 0);
    const emittedInvoices = invoices.filter((i) => i.status === 'EMITTED').length;

    return {
      totalSales: completedSales.length,
      realIncome, 
      totalProducts: products.filter((p) => p.is_active).length,
      totalCustomers: customers.filter((c) => c.is_active).length,
      totalCreditPending,
      emittedInvoices,
    };
  }, [completedSales, products, customers, invoices, creditAccounts, payments]);

  // Ventas de los últimos 30 días agrupadas por fecha
  const salesByDay = useMemo(() => {
    const map = {};
    const today = new Date();
    const cutoff = new Date(today);
    cutoff.setDate(today.getDate() - 30);

    completedSales.forEach((sale) => {
      const d = new Date(sale.sale_date + 'T00:00:00');
      if (d < cutoff) return;
      const key = sale.sale_date;
      map[key] = map[key] || { date: key, total: 0, count: 0 };
      map[key].total += Number(sale.total);
      map[key].count += 1;
    });

    return Object.values(map).sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [completedSales]);

  // Ingresos por mes
  const salesByMonth = useMemo(() => {
    const map = {};
    completedSales.forEach((sale) => {
      const month = sale.sale_date.slice(0, 7);
      map[month] = map[month] || { month, total: 0 };
      map[month].total += Number(sale.total);
    });
    return Object.values(map).sort((a, b) => (a.month < b.month ? -1 : 1));
  }, [completedSales]);

  // === LÓGICA DE PAGINACIÓN PARA TARJETAS ===
  const paginatedPayments = payments.slice((payPage - 1) * itemsPerPage, payPage * itemsPerPage);
  const totalPayPages = Math.ceil(payments.length / itemsPerPage);

  const paginatedSales = completedSales.slice((salePage - 1) * itemsPerPage, salePage * itemsPerPage);
  const totalSalePages = Math.ceil(completedSales.length / itemsPerPage);
  // ==========================================

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-sm text-slate-500">Resumen operativo y financiero del negocio.</p>
        </div>
        <Link to="/pos" className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">
          🛒 Ir al POS
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Card className="p-4">
          <p className="text-xs text-slate-500">Ventas completadas</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{stats.totalSales}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Ingresos en Caja (Reales)</p>
          <p className="mt-1 text-xl font-bold text-sky-700">
            <CurrencyText value={stats.realIncome} currency={currency} />
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Crédito por cobrar</p>
          <p className="mt-1 text-xl font-bold text-amber-600">
            <CurrencyText value={stats.totalCreditPending} currency={currency} />
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Productos activos</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{stats.totalProducts}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Facturas emitidas</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{stats.emittedInvoices}</p>
        </Card>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-3 font-semibold text-slate-700">Ingresos últimos 30 días</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesByDay}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="#0284c7" fill="url(#colorTotal)" name="Ingresos" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 font-semibold text-slate-700">Ingresos por mes</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#0284c7" radius={[4, 4, 0, 0]} name="Ingresos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* === Muro de Actividades Recientes === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Abonos Recientes */}
        <Card className="overflow-hidden flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold text-slate-700">Abonos Recientes</h3>
          </div>
          <div className="p-4 space-y-3 flex-grow">
            {paginatedPayments.length > 0 ? (
              paginatedPayments.map((p) => {
                const account = creditAccounts.find(acc => acc.id === p.credit_account_id);
                const customerId = account?.customer_id;
                const customerName = customersMap[customerId] || `Cliente #${customerId || p.credit_account_id}`;
                
                return (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-green-50 border border-green-100">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                      $                     </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        Abono de {customerName}
                      </p>
                      <p className="text-xs text-slate-500">Fecha: {p.payment_date}</p>
                    </div>
                    <div className="font-bold text-green-600">
                      + <CurrencyText value={p.amount} currency={currency} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-slate-400 py-6">No hay abonos registrados aún.</p>
            )}
          </div>
          {/* Paginación Abonos */}
          <div className="p-3 border-t border-slate-100">
            <Pagination currentPage={payPage} totalPages={totalPayPages} onPageChange={setPayPage} />
          </div>
        </Card>

        {/* Ventas recientes */}
        <Card className="overflow-hidden flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold text-slate-700">Ventas recientes</h3>
            <Link to="/sales" className="text-sm text-sky-600 hover:underline">Ver todas</Link>
          </div>
          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Pago</th>
                  <th className="px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-4 py-3">{sale.sale_date}</td>
                    <td className="px-4 py-3">Cliente #{sale.customer_id || '—'}</td>
                    <td className="px-4 py-3">{sale.payment_type}</td>
                    <td className="px-4 py-3 font-medium">
                      <CurrencyText value={sale.total} currency={currency} />
                    </td>
                  </tr>
                ))}
                {completedSales.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                      Aún no hay ventas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Paginación Ventas */}
          <div className="p-3 border-t border-slate-100">
            <Pagination currentPage={salePage} totalPages={totalSalePages} onPageChange={setSalePage} />
          </div>
        </Card>
      </div>
    </div>
  );
}