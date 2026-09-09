import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import DecimalInput from '../ui/DecimalInput';

const SALE_UNITS = ['KG', 'LB', 'UNIT'];

export default function ProductFormModal({
  open,
  onClose,
  initial = null,
  categories = [],
  onSubmit,
}) {
  const [form, setForm] = useState({
    code: initial?.code || '',
    name: initial?.name || '',
    description: initial?.description || '',
    category_id: initial?.category_id || '',
    price: initial ? String(initial.price) : '0.00',
    sale_unit: initial?.sale_unit || 'KG',
    is_active: initial?.is_active ?? true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      description: form.description?.trim() || null,
      category_id: form.category_id ? Number(form.category_id) : null,
      price: String(form.price || '0.00'),
      sale_unit: form.sale_unit,
      is_active: form.is_active,
    };
    onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Editar producto' : 'Nuevo producto'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Código"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            required
          />
          <Select
            label="Categoría"
            value={form.category_id}
            onChange={(e) =>
              setForm({ ...form, category_id: Number(e.target.value) || '' })
            }
          >
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <Input
          label="Nombre del producto"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <Input
          label="Descripción"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Unidad de venta"
            value={form.sale_unit}
            onChange={(e) => setForm({ ...form, sale_unit: e.target.value })}
          >
            {SALE_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>

          <DecimalInput
            label="Precio de venta"
            step="0.01"
            value={form.price}
            onChange={(value) => setForm({ ...form, price: value })}
            required
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
          />
          Producto activo
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            {initial ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
