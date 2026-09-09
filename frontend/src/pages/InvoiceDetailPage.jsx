import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useInvoiceStore } from '../stores/useInvoiceStore';

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams();
  const { currentInvoice, fetchInvoice, emitInvoice, cancelInvoice } = useInvoiceStore();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchInvoice(invoiceId).catch(() => {});
  }, [invoiceId]);

  const handleEmit = async () => {
    setProcessing(true);
    try {
      await emitInvoice(currentInvoice.id);
      alert('Factura emitida correctamente.');
    } catch (err) {
      alert(err.userMessage || err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('¿Seguro que deseas anular esta factura emitida?')) return;
    setProcessing(true);
    try {
      await cancelInvoice(currentInvoice.id);
      alert('Factura cancelada correctamente.');
    } catch (err) {
      alert(err.userMessage || err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!currentInvoice) {
    return <div className="rounded-lg bg-white p-8 text-center text-slate-500">Cargando factura...</div>;
  }

  const inv = currentInvoice;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Factura {inv.invoice_number || `#${inv.id}`}
          </h2>
          <Link to="/invoices" className="text-sm text-sky-600 hover:underline">
            ← Volver a facturas
          </Link>
        </div>
        <div className="space-x-2">
          {inv.status === 'DRAFT' && (
            <Button variant="success" onClick={handleEmit} disabled={processing}>
              {processing ? 'Procesando...' : 'Emitir factura'}
            </Button>
          )}
          {inv.status === 'EMITTED' && (
            <Button variant="danger" onClick={handleCancel} disabled={processing}>
              {processing ? 'Cancelando...' : 'Anular factura'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-slate-500">Estado</p>
          <p className="mt-1">
            <Badge
              color={
                inv.status === 'EMITTED'
                  ? 'green'
                  : inv.status === 'DRAFT'
                  ? 'amber'
                  : 'red'
              }
            >
              {inv.status}
            </Badge>
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Venta asociada</p>
          <Link to={`/sales/${inv.sale_id}`} className="text-sky-600 hover:underline">
            Ver venta #{inv.sale_id}
          </Link>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Fecha de emisión</p>
          <p className="mt-1 font-semibold">{inv.issue_date || 'No emitida'}</p>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="mb-2 font-semibold text-slate-700">Datos del cliente</h3>
        <p className="text-sm">{inv.customer_name}</p>
        <p className="text-sm text-slate-500">RUC/DNI: {inv.customer_tax_id}</p>
        {inv.customer_address && (
          <p className="text-sm text-slate-500">Dirección: {inv.customer_address}</p>
        )}
      </Card>

      <Card className="p-4">
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div>
            <p className="text-slate-500">Subtotal</p>
            <p className="font-semibold">{Number(inv.subtotal).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-slate-500">Impuestos</p>
            <p className="font-semibold">{Number(inv.tax_amount).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-slate-500">Total</p>
            <p className="text-lg font-bold text-sky-700">{Number(inv.total).toFixed(2)}</p>
          </div>
        </div>
      </Card>

      {inv.pdf_url && (
        <a
          href={inv.pdf_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Descargar PDF
        </a>
      )}
    </div>
  );
}
