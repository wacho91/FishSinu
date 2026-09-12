import { formatCurrency } from '../../lib/formatters';

export default function CurrencyText({ value, currency = 'COP' }) {
  // Usamos la función que ya adaptamos a pesos colombianos (sin decimales)
  return <span>{formatCurrency(value, currency)}</span>;
}