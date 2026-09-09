import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import CurrencyText from '../components/ui/CurrencyText';
import { useSalesStore } from '../stores/useSalesStore';
import { useSessionStore } from '../stores/useSessionStore';
import { useInvoiceStore } from '../stores/useInvoiceStore';
import { useCatalogStore } from '../stores/useCatalogStore';

export default function SalesDetailPage() {
  const { saleId } = useParams();
  const navigate = useNavigate();
  const { currentSale, fetchSale } = useSalesStore();
  const company = useSessionStore((s) => s.company);
  const { invoices, fetchInvoices, createInvoice, emitInvoice } = useInvoiceStore();
  const customers = useCatalogStore((s) => s.customers);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  useEffect(() => {
    fetchSale(saleId).catch(() => {});
    fetchInvoices().catch(() => {});
  }, [saleId]);

  if (!currentSale) {
    return <div className="rounded-lg bg-white p-8 text-center text-slate-500">Cargando venta...</div>;
  }

  const sale = currentSale;
  const customer = customers.find((c) => c.id === sale.customer_id);
  const invoice = invoices.find((inv) => inv.sale_id === sale.id);

  const handleCreateInvoice = async () => {
    try {
      await createInvoice({ sale_id: sale.id });
      await fetchInvoices();
      alert('Factura creada correctamente');
    } catch (err) {
      alert(err.userMessage || err.message);
    }
  };

  const handleEmitInvoice = async () => {
    if (!invoice) return;
    setLoadingInvoice(true);
    try {
      await emitInvoice(invoice.id);
      await fetchInvoices();
      alert('Factura emitida correctamente');
    } catch (err) {
      alert(err.userMessage || err.message);
    } finally {
      setLoadingInvoice(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Venta #{sale.id}</h2>
          <Link to="/sales" className="text-sm text-sky-600 hover:underline">
            ← Volver a ventas
          </Link>
        </div>
        <Badge color={sale.status === 'COMPLETED' ? 'green' : 'red'}>{sale.status}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-slate-500">Fecha</p>
          <p className="text-lg font-semibold">{sale.sale_date}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Cliente</p>
          <p className="text-lg font-semibold">{customer?.name || 'Consumidor final'}</p>
          <p className="text-xs text-slate-400">{customer?.tax_id}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Tipo de pago</p>
          <p className="text-lg font-semibold">{sale.payment_type}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Total</p>
          <p className="text-xl font-bold text-sky-700">
            <CurrencyText value={sale.total} currency={company?.currency} />
          </p>
        </Card>
      </div>

      {sale.notes && (
        <Card className="p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-500">Notas:</p> {sale.notes}
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="px-4 py-3 font-semibold text-slate-700">Items de la venta</div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Cantidad</th>
              <th className="px-4 py-3">Unidad</th>
              <th className="px-4 py-3">Precio unit.</th>
              <th className="px-4 py-3">Costo unit.</th>
              <th className="px-4 py-3">Total línea</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(sale.items || []).map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <div className="font-medium">{item.product?.name || item.description}</div>
                  <div className="text-xs text-slate-400">{item.product?.code}</div>
                </td>
                <td className="px-4 py-3">{Number(item.quantity).toFixed(4)}</td>
                <td className="px-4 py-3">{item.unit}</td>
                <td className="px-4 py-3">{Number(item.unit_price).toFixed(2)}</td>
                <td className="px-4 py-3">{Number(item.unit_cost).toFixed(2)}</td>
                <td className="px-4 py-3 font-medium">{Number(item.line_total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Facturación */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-700">Facturación electrónica</p>
            {invoice ? (
              <div className="mt-1 text-sm">
                Estado: <Badge color={invoice.status === 'EMITTED' ? 'green' : invoice.status === 'DRAFT' ? 'amber' : 'red'}>{invoice.status}</Badge>{' '}
                {invoice.invoice_number && <span> · N° {invoice.invoice_number}</span>}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Aún no se ha creado factura para esta venta.</p>
            )}
          </div>
          <div className="space-x-2">
            {!invoice && sale.status === 'COMPLETED' && (
              <Button variant="secondary" onClick={handleCreateInvoice}>
                Crear factura
              </Button>
            )}
            {invoice && invoice.status === 'DRAFT' && (
              <Button variant="success" onClick={handleEmitInvoice} disabled={loadingInvoice}>
                {loadingInvoice ? 'Emitiendo...' : 'Emitir factura'}
              </Button>
            )}
            {invoice && invoice.status === 'EMITTED' && (
              <Link to={`/invoices/${invoice.id}`}>
                <Button variant="outline">Ver factura</Button>
              </Link>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
