import { create } from 'zustand';
import {
  categoryApi,
  productApi,
  customerApi,
  creditAccountApi,
} from '../services/api';

export const useCatalogStore = create((set, get) => ({
  categories: [],
  products: [],
  customers: [],
  creditAccounts: [],
  loading: false,
  error: null,

  fetchCategories: async (params) => {
    const categories = await categoryApi.list(params);
    set({ categories });
    return categories;
  },

  fetchProducts: async (params) => {
    set({ loading: true });
    try {
      const products = await productApi.list(params);
      set({ products, loading: false });
      return products;
    } catch (error) {
      set({ loading: false, error: error.userMessage });
      throw error;
    }
  },

  fetchCustomers: async (params) => {
    set({ loading: true });
    try {
      const customers = await customerApi.list(params);
      set({ customers, loading: false });
      return customers;
    } catch (error) {
      set({ loading: false, error: error.userMessage });
      throw error;
    }
  },

  fetchCreditAccounts: async (params) => {
    set({ loading: true });
    try {
      const creditAccounts = await creditAccountApi.list(params);
      set({ creditAccounts, loading: false });
      return creditAccounts;
    } catch (error) {
      set({ loading: false, error: error.userMessage });
      throw error;
    }
  },

  loadAllBaseCatalog: async () => {
    const [categories, products, customers, creditAccounts] = await Promise.allSettled([
      categoryApi.list(),
      productApi.list(),
      customerApi.list(),
      creditAccountApi.list(),
    ]);
    set({
      categories: categories.status === 'fulfilled' ? categories.value : [],
      products: products.status === 'fulfilled' ? products.value : [],
      customers: customers.status === 'fulfilled' ? customers.value : [],
      creditAccounts: creditAccounts.status === 'fulfilled' ? creditAccounts.value : [],
    });
  },

  // ---- Categorías ----
  createCategory: async (payload) => {
    const created = await categoryApi.create(payload);
    set((s) => ({ categories: [created, ...s.categories] }));
    return created;
  },
  updateCategory: async (id, payload) => {
    const updated = await categoryApi.update(id, payload);
    set((s) => ({
      categories: s.categories.map((c) => (c.id === id ? updated : c)),
    }));
    return updated;
  },
  deleteCategory: async (id) => {
    await categoryApi.delete(id);
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
  },

  // ---- Productos ----
  createProduct: async (payload) => {
    const created = await productApi.create(payload);
    set((s) => ({ products: [created, ...s.products] }));
    return created;
  },
  updateProduct: async (id, payload) => {
    const updated = await productApi.update(id, payload);
    set((s) => ({
      products: s.products.map((p) => (p.id === id ? updated : p)),
    }));
    return updated;
  },
  deleteProduct: async (id) => {
    await productApi.delete(id);
    set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
  },

  // ---- Clientes ----
  createCustomer: async (payload) => {
    const created = await customerApi.create(payload);
    set((s) => ({ customers: [created, ...s.customers] }));
    return created;
  },
  updateCustomer: async (id, payload) => {
    const updated = await customerApi.update(id, payload);
    set((s) => ({
      customers: s.customers.map((c) => (c.id === id ? updated : c)),
    }));
    return updated;
  },
  deleteCustomer: async (id) => {
    await customerApi.delete(id);
    set((s) => ({ customers: s.customers.filter((c) => c.id !== id) }));
  },

  // ---- Cuentas de crédito ----
  createCreditAccount: async (payload) => {
    const created = await creditAccountApi.create(payload);
    set((s) => ({ creditAccounts: [created, ...s.creditAccounts] }));
    return created;
  },
  updateCreditAccount: async (id, payload) => {
    const updated = await creditAccountApi.update(id, payload);
    set((s) => ({
      creditAccounts: s.creditAccounts.map((c) => (c.id === id ? updated : c)),
    }));
    return updated;
  },
    deleteCreditAccount: async (id) => {
    await creditAccountApi.delete(id);
    set((s) => ({ creditAccounts: s.creditAccounts.filter((c) => c.id !== id) }));
  },
}));

// === AMBAS EXPORTACIONES PARA QUE NUNCA FALLE ===
export default useCatalogStore;
// ===============================================
// ========================================