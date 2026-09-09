import axios from 'axios';

/**
 * FishSinu — Capa de servicios conectada EXACTAMENTE a los endpoints
 * definidos en backend/src/routes.py
 *
 * El backend expone todas las rutas bajo /api/v1.
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
).replace(/\/$/, '');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = error.message || 'Error de red';
    if (error.response) {
      const detail = error.response.data?.detail;
      if (typeof detail === 'string') {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail.map((d) => d.msg || JSON.stringify(d)).join('. ');
      } else {
        message = `Error HTTP ${error.response.status}`;
      }
    }
    error.userMessage = message;
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Company settings
// ---------------------------------------------------------------------------
export const companyApi = {
  get: () => apiClient.get('/company-settings'),
  update: (data) => apiClient.put('/company-settings', data),
};

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------
export const profileApi = {
  list: () => apiClient.get('/profiles'),
  create: (data) => apiClient.post('/profiles', data),
  update: (id, data) => apiClient.patch(`/profiles/${id}`, data),
};

// ---------------------------------------------------------------------------
// Product categories
// ---------------------------------------------------------------------------
export const categoryApi = {
  list: (params) => apiClient.get('/categories', { params }),
  create: (data) => apiClient.post('/categories', data),
  update: (id, data) => apiClient.patch(`/categories/${id}`, data),
  delete: (id) => apiClient.delete(`/categories/${id}`),
};

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
export const productApi = {
  list: (params) => apiClient.get('/products', { params }),
  create: (data) => apiClient.post('/products', data),
  update: (id, data) => apiClient.patch(`/products/${id}`, data),
  delete: (id) => apiClient.delete(`/products/${id}`),
};

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------
export const customerApi = {
  list: (params) => apiClient.get('/customers', { params }),
  get: (id) => apiClient.get(`/customers/${id}`),
  create: (data) => apiClient.post('/customers', data),
  update: (id, data) => apiClient.patch(`/customers/${id}`, data),
  delete: (id) => apiClient.delete(`/customers/${id}`),
};

// ---------------------------------------------------------------------------
// Credit accounts
// ---------------------------------------------------------------------------
export const creditAccountApi = {
  list: (params) => apiClient.get('/credit-accounts', { params }),
  create: (data) => apiClient.post('/credit-accounts', data),
  update: (id, data) => apiClient.patch(`/credit-accounts/${id}`, data),
  delete: (id) => apiClient.delete(`/credit-accounts/${id}`),
};

// ---------------------------------------------------------------------------
// Payments / Abonos
// ---------------------------------------------------------------------------
export const paymentApi = {
  list: (params) => apiClient.get('/payments', { params }),
  create: (data) => apiClient.post('/payments', data),
};

// ---------------------------------------------------------------------------
// Inventory movements
// ---------------------------------------------------------------------------
export const inventoryApi = {
  list: (params) => apiClient.get('/inventory-movements', { params }),
  create: (data) => apiClient.post('/inventory-movements', data),
};

// ---------------------------------------------------------------------------
// Sales
// ---------------------------------------------------------------------------
export const saleApi = {
  list: (params) => apiClient.get('/sales', { params }),
  get: (id) => apiClient.get(`/sales/${id}`),
  create: (data) => apiClient.post('/sales', data),
};

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------
export const invoiceApi = {
  list: (params) => apiClient.get('/invoices', { params }),
  get: (id) => apiClient.get(`/invoices/${id}`),
  create: (data) => apiClient.post('/invoices', data),
  emit: (id) => apiClient.post(`/invoices/${id}/emit`),
  cancel: (id) => apiClient.post(`/invoices/${id}/cancel`),
};

export default apiClient;
