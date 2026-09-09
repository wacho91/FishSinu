import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import CheckoutModal from '../components/sales/CheckoutModal';
import { useCatalogStore } from '../stores/useCatalogStore';
import { useSalesStore } from '../stores/useSalesStore';
import { useSessionStore } from '../stores/useSessionStore';
import useDebounce from '../hooks/useDebounce';

export default function POSPage() {
  const navigate = useNavigate();
  const { products, customers, creditAccounts, fetchProducts, fetchCustomers, fetchCreditAccounts } =
    useCatalogStore();
  const { cart, addToCart, updateCartItem, removeCartItem, clearCart, createSale } = useSalesStore();
  const { currentProfile } = useSessionStore();
  const [search, setSearch] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    fetchProducts().catch(() => {});
    fetchCustomers().catch(() => {});
    fetchCreditAccounts().catch(() => {});
  }, []);

  useEffect(() => {
    if (debouncedSearch) {
      fetchProducts({ search: debouncedSearch }).catch(() => {});
    } else {
      fetchProducts().catch(() => {});
    }
  }, [debouncedSearch]);

  const total = cart.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
    0
  );

  const inCartQty = (productId) =>
    cart
      .filter((i) => i.product.id === productId)
      .reduce((sum, i) => sum + i.quantity, 0);

  const availableStock = (product) => Number(product.stock) - inCartQty(product.id);

  const handleAdd = (product) => {
    const available = availableStock(product);
    if (available <= 0) {
      alert('Stock insuficiente');
      return;
    }
    const defaultQty = product.sale_unit === 'UNIT' ? 1 : 1;
    addToCart(product, Math.min(defaultQty, available));
  };

  const handleCheckout = async (payload) => {
    if (!currentProfile) {
      alert('Selecciona un perfil/cajero en la barra superior antes de cobrar.');
      return;
    }
    setSubmitting(true);
    try {
      const payloadWithCashier = { ...payload, cashier_id: currentProfile.id };
      const sale = await createSale(payloadWithCashier);
      clearCart();
      setCheckoutOpen(false);
      navigate(`/sales/${sale.id}`);
    } catch (err) {
      alert(err.userMessage || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Catálogo */}
      <div className="lg:col-span-8">
        <div className="mb-4">
          <Input
            placeholder="Buscar producto por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            const available = availableStock(product);
            const disabled = available <= 0 || !product.is_active;
            return (
              <Card
                key={product.id}
                className={`flex flex-col p-4 transition ${disabled ? 'opacity-60' : 'hover:shadow-md'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800">{product.name}</p>
                    <p className="font-mono text-xs text-slate-400">{product.code}</p>
                  </div>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                    {product.sale_unit}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Precio: <span className="font-semibold text-slate-700">{Number(product.price).toFixed(2)}</span>
                </p>
                <p className="text-xs text-slate-400">Stock disponible: {available.toFixed(4)}</p>
                <Button
                  className="mt-3 w-full"
                  variant={disabled ? 'outline' : 'primary'}
                  disabled={disabled}
                  onClick={() => handleAdd(product)}
                >
                  {disabled ? 'Sin stock' : 'Agregar'}
                </Button>
              </Card>
            );
          })}
          {products.length === 0 && (
            <div className="col-span-full rounded-lg bg-white p-10 text-center text-slate-400">
              No se encontraron productos.
            </div>
          )}
        </div>
      </div>

      {/* Carrito */}
      <div className="space-y-4 lg:col-span-4">
        <Card className="p-4">
          <h3 className="mb-3 flex items-center justify-between text-lg font-semibold text-slate-800">
            <span>🛒 Carrito</span>
            <span className="text-sm font-normal text-slate-400">{cart.length} items</span>
          </h3>

          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {cart.length === 0 && (
              <p className="rounded-md bg-slate-50 px-3 py-6 text-center text-sm text-slate-400">
                Agrega productos para comenzar la venta.
              </p>
            )}
            {cart.map((item) => (
              <div key={item.product.id} className="rounded-md border border-slate-200 p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.product.name}</p>
                    <p className="text-xs text-slate-400">
                      {Number(item.unit_price).toFixed(2)} / {item.product.sale_unit}
                    </p>
                  </div>
                  <button
                    onClick={() => removeCartItem(item.product.id)}
                    className="text-xs text-rose-500 hover:underline"
                  >
                    quitar
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step={item.product.sale_unit === 'UNIT' ? 1 : '0.0001'}
                    value={Number(item.quantity)}
                    onChange={(e) => updateCartItem(item.product.id, e.target.value)}
                    className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
                  />
                  <span className="ml-auto text-sm font-semibold">
                    {(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total</span>
              <span className="text-xl font-bold text-slate-800">{total.toFixed(2)}</span>
            </div>
            <Button
              className="mt-4 w-full"
              variant="success"
              size="lg"
              disabled={cart.length === 0}
              onClick={() => setCheckoutOpen(true)}
            >
              COBRAR
            </Button>
          </div>
        </Card>
      </div>

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart}
        customers={customers}
        creditAccounts={creditAccounts}
        currency={'PEN'}
        loading={submitting}
        onConfirm={handleCheckout}
      />
    </div>
  );
}
