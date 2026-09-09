import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Select from '../ui/Select';
import DecimalInput from '../ui/DecimalInput';

const STATUSES = ['ACTIVE', 'BLOCKED', 'PAID'];

export default function CreditAccountModal({
  open,
  onClose,
  initial = null,
  customers = [],
  onSubmit,
}) {
  const [form, setForm] = useState({
    customer_id: initial?.customer_id || '',
    credit_limit: initial ? String(initial.credit_limit) : '0.00',
    status: initial?.status || 'ACTIVE',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      customer_id: Number(form.customer_id),
      credit_limit: String(form.credit_limit),
      status: form.status,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Editar cuenta de crédito' : 'Nueva cuenta de crédito'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Cliente"
          value={form.customer_id}
          onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
          required
          disabled={Boolean(initial)}
        >
          <option value="">Selecciona un cliente</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.tax_id})
            </option>
          ))}
        </Select>

        <DecimalInput
          label="Límite de crédito"
          step="0.01"
          value={form.credit_limit}
          onChange={(value) => setForm({ ...form, credit_limit: value })}
          required
        />

        <Select
          label="Estado"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            {initial ? 'Guardar cambios' : 'Crear cuenta'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
