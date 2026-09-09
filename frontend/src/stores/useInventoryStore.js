import { create } from 'zustand';
import { inventoryApi } from '../services/api';

export const useInventoryStore = create((set) => ({
  movements: [],
  loading: false,
  error: null,

  fetchMovements: async (params) => {
    set({ loading: true, error: null });
    try {
      const movements = await inventoryApi.list(params);
      set({ movements, loading: false });
      return movements;
    } catch (error) {
      set({ loading: false, error: error.userMessage || 'Error al cargar movimientos' });
      throw error;
    }
  },

  createMovement: async (payload) => {
    set({ loading: true, error: null });
    try {
      const created = await inventoryApi.create(payload);
      set((s) => ({ movements: [created, ...s.movements], loading: false }));
      return created;
    } catch (error) {
      set({ loading: false, error: error.userMessage || 'Error al crear movimiento' });
      throw error;
    }
  },
}));
