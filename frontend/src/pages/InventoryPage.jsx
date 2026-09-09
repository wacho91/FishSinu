import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useCatalogStore } from '../stores/useCatalogStore';
import StockEntryModal from '../components/inventory/StockEntryModal';

export default function InventoryPage() {
  const { movements, fetchMovements, createMovement } = useInventoryStore();
  const { products, fetchProducts } = useCatalogStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMovements().catch(() => {});
    fetchProducts().catch(() => {});
  }, []);

  const submit = async (payload) => {
    setLoading(true);
    try {
      await createMovement(payload);
      await fetchProducts();
      await fetchMovements();
      setOpen(false);
    } catch (err) {
      alert(err.userMessage || err.message);
    } finally {
      setLoading(false);
    }
  };

  const productName = (id) => products.find((p) => p.id === id)?.name || `#${id}`;
  const typeColor = (t) =>
    t === 'STOCK_IN'
      ? 'green'
      : t === 'STOCK_OUT'
      ? 'blue'
      : t === 'SPOILAGE'
      ? 'red'
      : 'amber';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Inventario / Movimientos</h2>
          <p className="text-sm text-slate-500">
            Historial de entradas, salidas, ajustes y mermas.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Nuevo movimiento</Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">Costo unit.</th>
                <th className="px-4 py-3">Stock después</th>
                <th className="px-4 py-3">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3">{new Date(m.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Badge color={typeColor(m.movement_type)}>{m.movement_type}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{productName(m.product_id)}</div>
                    {m.product && <div className="text-xs text-slate-400">{m.product.code}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {Number(m.quantity) < 0 ? '-' : ''}
                    {Math.abs(Number(m.quantity)).toFixed(4)}
                  </td>
                  <td className="px-4 py-3">{Number(m.unit_cost).toFixed(2)}</td>
                  <td className="px-4 py-3">{Number(m.stock_after).toFixed(4)}</td>
                  <td className="px-4 py-3 text-slate-500">{m.reason || '—'}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No hay movimientos todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <StockEntryModal
        open={open}
        onClose={() => setOpen(false)}
        products={products}
        onSubmit={submit}
      />
    </div>
  );
}
