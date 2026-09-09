import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Input from '../ui/Input';
import CurrencyText from '../ui/CurrencyText';

const PAYMENT_TYPES = ['CASH', 'CARD', 'TRANSFER', 'CREDIT', 'MIXED'];

export default function CheckoutModal({
  open,
  onClose,
  cart,
  customers,
  creditAccounts,
  currency = 'PEN',
  loading,
  onConfirm,
}) {
  const [paymentType, setPaymentType] = useState('CASH');
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const selectedCustomer = customers.find((c) => c.id === Number(customerId));
  const selectedCreditAccounts = creditAccounts.filter(
    (ca) => ca.customer_id === Number(customerId)
  );
  const [creditAccountId, setCreditAccountId] = useState('');

  const total = cart.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
    0
  );

  const reset = () => {
    setPaymentType('CASH');
    setCustomerId('');
    setCreditAccountId('');
    setNotes('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleConfirm = () => {
    const payload = {
      payment_type: paymentType,
      notes: notes?.trim() || null,
      items: cart.map((item) => ({
        product_id: item.product.id,
        quantity: Number(item.quantity).toFixed(4),
        unit: item.product.sale_unit,
        unit_price: Number(item.unit_price).toFixed(2),
        description: item.product.name,
      })),
    };

    if (customerId) payload.customer_id = Number(customerId);

    if (paymentType === 'CREDIT') {
      if (!selectedCustomer) {
        alert('Selecciona un cliente con cuenta de crédito.');
        return;
      }
      if (!creditAccountId || Number(creditAccountId) === 0) {
        alert('Selecciona la cuenta de crédito del cliente.');
        return;
      }
      payload.credit_account_id = Number(creditAccountId);
    }

    onConfirm(payload);
  };

  return (
    <Modal open={open} onClose={handleClose} title="Confirmar venta / COBRAR">
      <div className="space-y-4">
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <p className="text-slate-500">
            {cart.length} línea(s) · Total a cobrar
          </p>
          <p className="text-2xl font-bold text-slate-800">
            <CurrencyText value={total} currency={currency} />
          </p>
        </div>

        <Select
          label="Tipo de pago"
          value={paymentType}
          onChange={(e) => {
            setPaymentType(e.target.value);
            setCreditAccountId('');
          }}
        >
          {PAYMENT_TYPES.map((p) => (
            <option key={p} value={p}>
              {p === 'CASH'
                ? 'Efectivo'
                : p === 'CARD'
                ? 'Tarjeta'
                : p === 'TRANSFER'
                ? 'Transferencia'
                : p === 'CREDIT'
                ? 'Crédito'
                : 'Mixto'}
            </option>
          ))}
        </Select>

        <Select
          label={paymentType === 'CREDIT' ? 'Cliente (obligatorio)' : 'Cliente (opcional)'}
          value={customerId}
          onChange={(e) => {
            setCustomerId(e.target.value);
            setCreditAccountId('');
          }}
        >
          <option value="">Consumidor final</option>
          {customers
            .filter((c) => (paymentType === 'CREDIT' ? c.is_active : true))
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.tax_id}
              </option>
            ))}
        </Select>

        {paymentType === 'CREDIT' && selectedCustomer && (
          <Select
            label="Cuenta de crédito"
            value={creditAccountId}
            onChange={(e) => setCreditAccountId(e.target.value)}
          >
            <option value="">Selecciona la cuenta</option>
            {selectedCreditAccounts.map((ca) => (
              <option key={ca.id} value={ca.id}>
                Límite {Number(ca.credit_limit).toFixed(2)} — Saldo{' '}
                {Number(ca.balance).toFixed(2)} — {ca.status}
              </option>
            ))}
          </Select>
        )}

        {paymentType === 'CREDIT' && selectedCreditAccounts.length === 0 && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Este cliente no tiene cuenta de crédito. Créala en el módulo Créditos.
          </p>
        )}

        <Input
          label="Notas / Observaciones"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Opcional"
        />

        <div className="max-h-40 overflow-y-auto border divide-y divide-slate-100 rounded-lg border-slate-200 bg-white">
          {cart.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center justify-between px-3 py-2 text-sm"
            >
              <span>
                {item.product.name} × {item.quantity} {item.product.sale_unit}
              </span>
              <span className="font-medium">
                {(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="success" onClick={handleConfirm} disabled={loading || cart.length === 0}>
            {loading ? 'Procesando...' : 'Confirmar venta'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
