import { create } from 'zustand';
import { invoiceApi } from '../services/api';

export const useInvoiceStore = create((set) => ({
  invoices: [],
  currentInvoice: null,
  loading: false,
  error: null,

  fetchInvoices: async (params) => {
    set({ loading: true, error: null });
    try {
      const invoices = await invoiceApi.list(params);
      set({ invoices, loading: false });
      return invoices;
    } catch (error) {
      set({ loading: false, error: error.userMessage || 'Error al cargar facturas' });
      throw error;
    }
  },

  fetchInvoice: async (id) => {
    set({ loading: true, error: null });
    try {
      const invoice = await invoiceApi.get(id);
      set({ currentInvoice: invoice, loading: false });
      return invoice;
    } catch (error) {
      set({ loading: false, error: error.userMessage || 'Error al cargar factura' });
      throw error;
    }
  },

  createInvoice: async (payload) => {
    const invoice = await invoiceApi.create(payload);
    set((s) => ({ invoices: [invoice, ...s.invoices] }));
    return invoice;
  },

  emitInvoice: async (id) => {
    const invoice = await invoiceApi.emit(id);
    set((s) => ({
      currentInvoice: invoice,
      invoices: s.invoices.map((i) => (i.id === id ? invoice : i)),
    }));
    return invoice;
  },

  cancelInvoice: async (id) => {
    const invoice = await invoiceApi.cancel(id);
    set((s) => ({
      currentInvoice: invoice,
      invoices: s.invoices.map((i) => (i.id === id ? invoice : i)),
    }));
    return invoice;
  },
}));
