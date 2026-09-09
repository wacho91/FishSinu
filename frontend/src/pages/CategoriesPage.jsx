import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import useCatalogStore from '../stores/useCatalogStore';

export default function CategoriesPage() {
  const { categories, fetchCategories, createCategory, updateCategory, deleteCategory } =
    useCatalogStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchCategories().catch(() => {});
  }, []);

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
    } catch (err) {
      alert(err.userMessage || err.message);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`¿Eliminar categoría ${cat.name}?`)) return;
    try {
      await deleteCategory(cat.id);
    } catch (err) {
      alert(err.userMessage || err.message);
    }
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
            {categories.map((c) => (
              <tr key={c.id}>
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
          </tbody>
        </table>
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
