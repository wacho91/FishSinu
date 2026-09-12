export const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  return parseFloat(value) || 0;
};

// Formato de Pesos Colombianos forzado a mostrar "COP $"
export const formatCurrency = (value, currency = 'COP') => {
  const n = toNumber(value);
  // Formateamos el número con separadores de miles y sin decimales
  const formattedNumber = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(n);
  
  // Forzamos a que siempre lleve el prefijo "COP $"
  return `COP $ ${formattedNumber}`;
};

// Formato decimal limpio (para kilos de pescado)
export const formatDecimal = (value) => {
  const n = toNumber(value);
  if (isNaN(n)) return '0';
  // Si es entero, lo muestra sin decimales. Si no, con 2 decimales.
  return n % 1 === 0 ? n.toFixed(0) : n.toFixed(2);
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