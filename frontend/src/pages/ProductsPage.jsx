import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
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
      Swal.fire({
        icon: 'success',
        title: '¡Guardado!',
        text: `El producto ha sido ${editing ? 'actualizado' : 'creado'} correctamente.`,
        confirmButtonColor: '#0d9488',
        timer: 2000,
        timerProgressBar: true
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: err.userMessage || err.message || 'Ocurrió un error al guardar.',
        confirmButtonColor: '#0d9488'
      });
    }
  };

  const handleDelete = async (product) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar el producto "${product.name}". Esta acción no se puede revertir.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48', // rojo rose-600
      cancelButtonColor: '#64748b', // gris slate-500
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteProduct(product.id);
          Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'El producto ha sido eliminado.',
            confirmButtonColor: '#0d9488',
            timer: 1500
          });
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: 'Restricción de ERP',
            text: 'No se puede eliminar el producto porque tiene movimientos o ventas asociadas. Usa el botón "Desactivar" en su lugar.',
            confirmButtonColor: '#0d9488'
          });
        }
      }
    });
  };

  const handleToggleActive = async (product) => {
    const actionText = product.is_active ? 'Desactivar' : 'Activar';
    Swal.fire({
      title: `${actionText} producto`,
      text: `¿Seguro que quieres ${actionText.toLowerCase()} "${product.name}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0d9488',
      cancelButtonColor: '#64748b',
      confirmButtonText: `Sí, ${actionText.toLowerCase()}`,
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await updateProduct(product.id, { is_active: !product.is_active });
          Swal.fire({
            icon: 'success',
            title: 'Acción completada',
            text: `El producto ha sido ${product.is_active ? 'desactivado' : 'activado'}.`,
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
        }
      }
    });
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