import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useInvoiceStore } from '../stores/useInvoiceStore';
import { useSalesStore } from '../stores/useSalesStore';
import { useSessionStore } from '../stores/useSessionStore';
import { formatCurrency, formatDecimal } from '../utils/formatters';

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams();
  const { currentInvoice, fetchInvoice, emitInvoice, cancelInvoice } = useInvoiceStore();
  const { currentSale, fetchSale } = useSalesStore();
  const { company } = useSessionStore();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchInvoice(invoiceId).catch(() => {});
  }, [invoiceId]);

  // Cargar los items de la venta para mostrarlos en la factura
  useEffect(() => {
    if (currentInvoice?.sale_id) {
      fetchSale(currentInvoice.sale_id).catch(() => {});
    }
  }, [currentInvoice, fetchSale]);

  const handleEmit = async () => {
    setProcessing(true);
    try {
      await emitInvoice(currentInvoice.id);
      Swal.fire({
        icon: 'success',
        title: '¡Factura Emitida!',
        text: 'La factura se ha generado correctamente.',
        confirmButtonColor: '#0d9488',
        timer: 2000
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.userMessage || err.message,
        confirmButtonColor: '#0d9488'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    Swal.fire({
      title: '¿Anular factura?',
      text: 'Esta acción no se puede revertir.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setProcessing(true);
        try {
          await cancelInvoice(currentInvoice.id);
          Swal.fire({
            icon: 'success',
            title: 'Anulada',
            text: 'La factura ha sido anulada.',
            confirmButtonColor: '#0d9488',
            timer: 1500
          });
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.userMessage || err.message,
            confirmButtonColor: '#0d9488'
          });
        } finally {
          setProcessing(false);
        }
      }
    });
  };

  if (!currentInvoice) {
    return <div className="rounded-lg bg-white p-8 text-center text-slate-500">Cargando factura...</div>;
  }

  const inv = currentInvoice;
  const items = currentSale?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Documento Fiscal</h2>
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

      {/* Contenedor del Documento (Estilo Papel) */}
      <Card className="p-8 max-w-4xl mx-auto shadow-lg">
        
        {/* Encabezado con datos de la Empresa */}
        <div className="flex flex-wrap justify-between items-start border-b border-slate-200 pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-teal-700 uppercase tracking-wide">
              {company?.business_name || 'FishSinu'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">NIT: {company?.tax_id || '—'}</p>
            <p className="text-sm text-slate-500">Tel: {company?.phone || '—'}</p>
            <p className="text-sm text-slate-500">Dir: {company?.address || '—'}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-slate-800 uppercase">Factura</h2>
            <p className="font-mono text-slate-600 mt-1">{inv.invoice_number || `Borrador #${inv.id}`}</p>
            <p className="text-sm text-slate-500 mt-2">Fecha: {inv.issue_date || 'Pendiente'}</p>
            <div className="mt-2">
              <Badge color={inv.status === 'EMITTED' ? 'green' : inv.status === 'DRAFT' ? 'amber' : 'red'}>
                {inv.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Datos del Cliente */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Facturar a</h3>
          <p className="text-lg font-semibold text-slate-800">{inv.customer_name}</p>
          <p className="text-sm text-slate-500">Doc: {inv.customer_tax_id}</p>
          {inv.customer_address && <p className="text-sm text-slate-500">Dirección: {inv.customer_address}</p>}
        </div>

        {/* Tabla de Productos (El desglose exacto) */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg mb-6">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3 text-center">Cantidad</th>
                <th className="px-4 py-3 text-right">Precio Unit.</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium text-slate-800">{item.description || item.product?.name}</td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      {formatDecimal(item.quantity)} {item.unit || 'kg'}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.unit_price)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      {formatCurrency(item.line_total)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    Cargando items de la venta...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(inv.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Impuestos</span>
              <span>{formatCurrency(inv.tax_amount)}</span>
            </div>
            <div className="flex justify-between text-lg font-extrabold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total</span>
              <span className="text-teal-700">{formatCurrency(inv.total)}</span>
            </div>
          </div>
        </div>

        {/* Pie de página */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-400">Gracias por su compra</p>
          <p className="text-xs text-slate-400 mt-1">Este documento es válido como recibo de pago.</p>
        </div>
      </Card>

      {inv.pdf_url && (
        <div className="text-center">
          <a
            href={inv.pdf_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Descargar PDF
          </a>
        </div>
      )}
    </div>
  );
}