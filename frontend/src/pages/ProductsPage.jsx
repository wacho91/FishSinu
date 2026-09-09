import { useEffect, useMemo, useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import CurrencyText from '../components/ui/CurrencyText';
import ProductFormModal from '../components/products/ProductFormModal';
import { useCatalogStore } from '../stores/useCatalogStore';

export default function ProductsPage() {
  const {
    products,
    categories,
    loading,
    fetchProducts,
    fetchCategories,
    createProduct,
    updateProduct,
    deleteProduct,
    error,
  } = useCatalogStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCategories().catch(() => {});
    fetchProducts().catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
    );
  }, [products, search]);

  const categoryName = (id) => categories.find((c) => c.id === id)?.name || '—';

  const handleSubmit = async (payload) => {
    try {
      if (editing) await updateProduct(editing.id, payload);
      else await createProduct(payload);
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      alert(err.userMessage || err.message);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`¿Eliminar producto ${product.name}?`)) return;
    try {
      await deleteProduct(product.id);
    } catch (err) {
      alert(err.userMessage || err.message);
    }
  };

  const handleToggleActive = async (product) => {
    try {
      await updateProduct(product.id, { is_active: !product.is_active });
    } catch (err) {
      alert(err.userMessage || err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Productos</h2>
          <p className="text-sm text-slate-500">
            Catálogo de pescados y mariscos.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          + Nuevo producto
        </Button>
      </div>

      {error && <div className="rounded-md bg-rose-50 px-3 py-2 text-rose-700">{error}</div>}

      <Card className="overflow-hidden">
        <div className="p-3">
          <Input
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Unidad</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{p.code}</td>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3">{categoryName(p.category_id)}</td>
                  <td className="px-4 py-3">{p.sale_unit}</td>
                  <td className="px-4 py-3">{Number(p.stock)}</td>
                  <td className="px-4 py-3">
                    <CurrencyText value={p.price} />
                  </td>
                  <td className="px-4 py-3">
                    {p.is_active ? (
                      <Badge color="green">Activo</Badge>
                    ) : (
                      <Badge color="red">Inactivo</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="mr-1"
                      onClick={() => {
                        setEditing(p);
                        setFormOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleActive(p)}
                    >
                      {p.is_active ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(p)}>
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No hay productos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ProductFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        initial={editing}
        categories={categories}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
