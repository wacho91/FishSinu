export const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  return parseFloat(value) || 0;
};

export const formatCurrency = (value, currency = 'PEN') =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(toNumber(value));

export const formatDecimal = (value, digits = 4) => {
  const n = toNumber(value);
  return n.toFixed(digits);
};

export const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const todayISO = () => new Date().toISOString().slice(0, 10);
