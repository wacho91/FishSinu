import { formatCurrency } from '../../lib/formatters';

export default function CurrencyText({ value, currency = 'PEN', className = '' }) {
  return <span className={className}>{formatCurrency(value, currency)}</span>;
}
