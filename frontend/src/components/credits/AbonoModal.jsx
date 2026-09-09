import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Select from '../ui/Select';
import DecimalInput from '../ui/DecimalInput';

const PAYMENT_TYPES = ['CASH', 'CARD', 'TRANSFER', 'MIXED'];

export default function AbonoModal({
  open,
  onClose,
  account,
  onSubmit,
}) {
  const [form, setForm] = useState({
    amount: '',
    payment_type: 'CASH',
    reference: '',
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return;
    onSubmit({
      credit_account_id: account.id,
      amount: String(form.amount),
      payment_type: form.payment_type,
      reference: form.reference?.trim() || null,
      notes: form.notes?.trim() || null,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Registrar abono">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <p className="text-slate-500">Saldo actual de la cuenta</p>
          <p className="text-xl font-semibold text-slate-800">
            {Number(account?.balance).toFixed(2)}
          </p>
        </div>

        <DecimalInput
          label="Monto del abono"
          step="0.01"
          value={form.amount}
          onChange={(value) => setForm({ ...form, amount: value })}
          required
          min="0.01"
        />

        <Select
          label="Método de pago"
          value={form.payment_type}
          onChange={(e) => setForm({ ...form, payment_type: e.target.value })}
        >
          {PAYMENT_TYPES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Referencia"
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
          />
          <Input
            label="Notas"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="success">
            Confirmar abono
          </Button>
        </div>
      </form>
    </Modal>
  );
}
