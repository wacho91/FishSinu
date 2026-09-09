import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useInvoiceStore } from '../stores/useInvoiceStore';

export default function InvoicesPage() {
  const { invoices, loading, error, fetchInvoices } = useInvoiceStore();

  useEffect(() => {
    fetchInvoices().catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Facturas</h2>
        <p className="text-sm text-slate-500">Facturas fiscales vinculadas a ventas.</p>
      </div>

      {error && <div className="rounded-md bg-rose-50 px-3 py-2 text-rose-700">{error}</div>}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">N° Factura</th>
                <th className="px-4 py-3">Venta</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Fecha emisión</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-3 font-mono text-xs">#{inv.id}</td>
                  <td className="px-4 py-3 font-medium">{inv.invoice_number || '—'}</td>
                  <td>
                    <Link to={`/sales/${inv.sale_id}`} className="text-sky-600 hover:underline">
                      #{inv.sale_id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{inv.customer_name}</td>
                  <td className="px-4 py-3">{inv.issue_date || 'No emitida'}</td>
                  <td className="px-4 py-3 font-medium">{Number(inv.total).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <Badge
                      color={
                        inv.status === 'EMITTED'
                          ? 'green'
                          : inv.status === 'DRAFT'
                          ? 'amber'
                          : inv.status === 'CANCELLED'
                          ? 'red'
                          : 'slate'
                      }
                    >
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/invoices/${inv.id}`}>
                      <span className="text-sky-600 hover:underline">Ver detalle →</span>
                    </Link>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No hay facturas registradas.
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
