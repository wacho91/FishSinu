import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import CheckoutModal from '../components/sales/CheckoutModal';
import { useCatalogStore } from '../stores/useCatalogStore';
import { useSalesStore } from '../stores/useSalesStore';
import { useSessionStore } from '../stores/useSessionStore';
import useDebounce from '../hooks/useDebounce';
import { formatCurrency, formatDecimal } from '../utils/formatters';

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
      Swal.fire({
        icon: 'warning',
        title: 'Stock insuficiente',
        text: `No hay más ${product.name} disponible en inventario.`,
        confirmButtonColor: '#0d9488'
      });
      return;
    }
    const defaultQty = product.sale_unit === 'UNIT' ? 1 : 1;
    addToCart(product, Math.min(defaultQty, available));
  };

  const handleCheckout = async (payload) => {
    if (!currentProfile) {
      Swal.fire({
        icon: 'warning',
        title: 'Cajero no seleccionado',
        text: 'Selecciona un perfil/cajero en la barra superior antes de cobrar.',
        confirmButtonColor: '#0d9488'
      });
      return;
    }
    setSubmitting(true);
    try {
      const payloadWithCashier = { ...payload, cashier_id: currentProfile.id };
      const sale = await createSale(payloadWithCashier);
      clearCart();
      setCheckoutOpen(false);
      Swal.fire({
        icon: 'success',
        title: '¡Venta Exitosa!',
        text: 'La venta se ha registrado correctamente.',
        confirmButtonColor: '#0d9488',
        timer: 1500,
        timerProgressBar: true
      });
      navigate(`/sales/${sale.id}`);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error en la venta',
        text: err.userMessage || err.message || 'Ocurrió un error al procesar la venta.',
        confirmButtonColor: '#0d9488'
      });
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
            const unitLabel = product.sale_unit === 'KG' ? 'kg' : product.sale_unit;
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
                </div>
                {/* Precio formateado a COP */}
                <p className="mt-2 text-lg font-bold text-teal-700">
                  {formatCurrency(product.price)}
                </p>
                {/* Stock formateado limpio + kg */}
                <p className="text-xs text-slate-500 mt-1">
                  Stock: {formatDecimal(available)} {unitLabel}
                </p>
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
                      {formatCurrency(item.unit_price)} / {item.product.sale_unit}
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
                  <span className="ml-auto text-sm font-semibold text-slate-700">
                    {formatCurrency(Number(item.quantity) * Number(item.unit_price))}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total</span>
              {/* Total formateado a COP */}
              <span className="text-xl font-bold text-slate-800">{formatCurrency(total)}</span>
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
        currency={'COP'} // Moneda cambiada a COP
        loading={submitting}
        onConfirm={handleCheckout}
      />
    </div>
  );
}