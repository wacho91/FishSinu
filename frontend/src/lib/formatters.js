export const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  return parseFloat(value) || 0;
};

// Formato de Pesos Colombianos (COP) - Sin decimales
export const formatCurrency = (value, currency = 'COP') =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(toNumber(value));

export const formatDecimal = (value, digits = 4) => {
  const n = toNumber(value);
  return n.toFixed(digits);
};

// Formato de Fecha Colombiana
export const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const todayISO = () => new Date().toISOString().slice(0, 10);