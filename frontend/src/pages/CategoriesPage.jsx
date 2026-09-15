import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import Pagination from '../components/ui/Pagination'; // <-- Importamos la paginación
import useCatalogStore from '../stores/useCatalogStore';

export default function CategoriesPage() {
  const { categories, fetchCategories, createCategory, updateCategory, deleteCategory } =
    useCatalogStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // === ESTADOS DE PAGINACIÓN ===
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  // ==============================

  useEffect(() => {
    fetchCategories().catch(() => {});
  }, []);

  // === LÓGICA DE PAGINACIÓN ===
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentCategories = categories.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(categories.length / itemsPerPage);
  // ==============================

  const openNew = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateCategory(editing.id, {
          name,
          description: description || null,
        });
      } else {
        await createCategory({ name, description: description || null });
      }
      setOpen(false);
      Swal.fire({
        icon: 'success',
        title: '¡Guardado!',
        text: `Categoría ${editing ? 'actualizada' : 'creada'} correctamente.`,
        confirmButtonColor: '#0d9488',
        timer: 2000,
        timerProgressBar: true
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.userMessage || err.message || 'Ocurrió un error al guardar.',
        confirmButtonColor: '#0d9488'
      });
    }
  };

  const handleDelete = async (cat) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar la categoría "${cat.name}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteCategory(cat.id);
          Swal.fire({
            icon: 'success',
            title: 'Eliminada',
            text: 'La categoría ha sido eliminada.',
            confirmButtonColor: '#0d9488',
            timer: 1500
          });
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: 'Restricción de ERP',
            text: 'No se puede eliminar la categoría porque tiene productos asociados.',
            confirmButtonColor: '#0d9488'
          });
        }
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Categorías</h2>
          <p className="text-sm text-slate-500">Clasificación de productos.</p>
        </div>
        <Button onClick={openNew}>+ Nueva categoría</Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Usamos currentCategories en vez de categories */}
            {currentCategories.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-slate-500">{c.description || '—'}</td>
                <td className="px-4 py-3">
                  {c.is_active ? (
                    <Badge color="green">Activa</Badge>
                  ) : (
                    <Badge color="red">Inactiva</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Button size="sm" variant="outline" className="mr-1" onClick={() => openEdit(c)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(c)}>
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))}
            {currentCategories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  No hay categorías registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Componente de Paginación */}
        <div className="p-4 border-t border-slate-100">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar categoría' : 'Nueva categoría'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            label="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}