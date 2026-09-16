import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { formatCurrency, formatDecimal, formatDate } from '../lib/formatters';

export default function ZReportPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('fishsinu_token');
    const headers = { Authorization: `Bearer ${token}` };

    // 1. Obtenemos todas las ventas completadas
    fetch('https://fishsinu.onrender.com/api/v1/sales', { headers })
      .then(res => res.ok ? res.json() : [])
      .then(async (data) => {
        const today = new Date().toISOString().slice(0, 10);
        const todaySalesSummary = data.filter(s => s.status === 'COMPLETED' && s.sale_date === today);
        
        // 2. Obtenemos el detalle de cada venta (para saber los items)
        const detailedSales = await Promise.all(
          todaySalesSummary.map(s => 
            fetch(`https://fishsinu.onrender.com/api/v1/sales/${s.id}`, { headers })
              .then(res => res.ok ? res.json() : null)
          )
        );
        setSales(detailedSales.filter(Boolean));
      })
      .catch(() => Swal.fire('Error', 'No se pudieron cargar las ventas', 'error'))
      .finally(() => setLoading(false));
  }, []);

  // Cálculos del Z-Report
  const report = {
    totalSales: sales.length,
    cash: 0,
    transfer: 0,
    card: 0,
    credit: 0,
    totalIncome: 0,
    productMovement: {}
  };

  sales.forEach(sale => {
    if (sale.payment_type === 'CASH') report.cash += Number(sale.total);
    if (sale.payment_type === 'TRANSFER') report.transfer += Number(sale.total);
    if (sale.payment_type === 'CARD') report.card += Number(sale.total);
    if (sale.payment_type === 'CREDIT') report.credit += Number(sale.total);
    report.totalIncome += Number(sale.total);

    (sale.items || []).forEach(item => {
      const name = item.product?.name || item.description || 'Desconocido';
      if (!report.productMovement[name]) {
        report.productMovement[name] = { quantity: 0, total: 0 };
      }
      report.productMovement[name].quantity += Number(item.quantity);
      report.productMovement[name].total += Number(item.line_total);
    });
  });

  const productsArray = Object.entries(report.productMovement).map(([name, val]) => ({ name, ...val }));

  if (loading) return <div className="p-8 text-center text-slate-500">Generando reporte de cierre...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Cierre de Caja (Z-Report)</h2>
          <p className="text-sm text-slate-500">Fecha: {formatDate(new Date().toISOString())}</p>
        </div>
        <Button onClick={() => window.print()}>🖨️ Imprimir / PDF</Button>
      </div>

      {/* Resumen de Ingresos */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4 bg-sky-50 border-sky-100">
          <p className="text-xs text-slate-500">Total Ventas</p>
          <p className="mt-1 text-xl font-bold text-sky-700">{report.totalSales}</p>
        </Card>
        <Card className="p-4 bg-green-50 border-green-100">
          <p className="text-xs text-slate-500">Efectivo</p>
          <p className="mt-1 text-lg font-bold text-green-700">{formatCurrency(report.cash)}</p>
        </Card>
        <Card className="p-4 bg-blue-50 border-blue-100">
          <p className="text-xs text-slate-500">Transferencia</p>
          <p className="mt-1 text-lg font-bold text-blue-700">{formatCurrency(report.transfer)}</p>
        </Card>
        <Card className="p-4 bg-purple-50 border-purple-100">
          <p className="text-xs text-slate-500">Tarjeta</p>
          <p className="mt-1 text-lg font-bold text-purple-700">{formatCurrency(report.card)}</p>
        </Card>
        <Card className="p-4 bg-amber-50 border-amber-100">
          <p className="text-xs text-slate-500">Crédito (Fiado)</p>
          <p className="mt-1 text-lg font-bold text-amber-700">{formatCurrency(report.credit)}</p>
        </Card>
      </div>

      {/* Total General */}
      <Card className="p-4 flex justify-between items-center">
        <span className="text-lg font-semibold text-slate-700">Ingresos Totales del Día:</span>
        <span className="text-2xl font-extrabold text-teal-700">{formatCurrency(report.totalIncome)}</span>
      </Card>

      {/* Movimiento de Mercancía */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 font-semibold text-slate-700">
          Movimiento de Mercancía (Pescado Vendido)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3 text-center">Kilos Vendidos</th>
                <th className="px-4 py-3 text-right">Total Generado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productsArray.length > 0 ? (
                productsArray.map((p, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700">
                      {formatDecimal(p.quantity)} kg
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(p.total)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                    No se ha vendido mercancía hoy.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detalle de Ventas a Crédito */}
      {report.credit > 0 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 font-semibold text-slate-700 bg-amber-50">
            Ventas a Crédito (Pendientes de cobro)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Venta #</th>
                  <th className="px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.filter(s => s.payment_type === 'CREDIT').map(sale => (
                  <tr key={sale.id}>
                    <td className="px-4 py-3">#{sale.id}</td>
                    <td className="px-4 py-3 font-bold text-amber-700">{formatCurrency(sale.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}