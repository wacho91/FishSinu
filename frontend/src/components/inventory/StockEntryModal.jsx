import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Input from '../ui/Input';
import DecimalInput from '../ui/DecimalInput';

const MOVEMENT_TYPES = ['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'SPOILAGE'];

export default function StockEntryModal({
  open,
  onClose,
  products,
  onSubmit,
}) {
  const [form, setForm] = useState({
    product_id: '',
    movement_type: 'STOCK_IN',
    quantity: '',
    unit_cost: '',
    reason: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      product_id: Number(form.product_id),
      movement_type: form.movement_type,
      quantity: String(form.quantity),
      unit_cost: form.unit_cost ? String(form.unit_cost) : null,
      reason: form.reason?.trim() || null,
    };
    onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar movimiento de inventario"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Producto"
          value={form.product_id}
          onChange={(e) => setForm({ ...form, product_id: e.target.value })}
          required
        >
          <option value="">Selecciona un producto</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} — {p.name}
            </option>
          ))}
        </Select>

        <Select
          label="Tipo de movimiento"
          value={form.movement_type}
          onChange={(e) => setForm({ ...form, movement_type: e.target.value })}
        >
          {MOVEMENT_TYPES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>

        <DecimalInput
          label="Cantidad"
          step="0.0001"
          value={form.quantity}
          onChange={(value) => setForm({ ...form, quantity: value })}
          required
          min={undefined}
          hint={
            form.movement_type === 'ADJUSTMENT'
              ? 'Para Ajuste: usa signo negativo si reduces stock (ej: -2.5)'
              : null
          }
        />

        {(form.movement_type === 'STOCK_IN' ||
          form.movement_type === 'ADJUSTMENT') && (
          <DecimalInput
            label="Costo unitario (opcional)"
            step="0.0001"
            value={form.unit_cost}
            onChange={(value) => setForm({ ...form, unit_cost: value })}
            placeholder="Si se deja vacío se usa el costo promedio"
          />
        )}

        <Input
          label="Motivo / Referencia"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          placeholder="Ej: Compra a proveedor, merma por refrigeración, etc."
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            Registrar movimiento
          </Button>
        </div>
      </form>
    </Modal>
  );
}
