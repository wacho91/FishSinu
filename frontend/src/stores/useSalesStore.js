import { create } from 'zustand';
import { saleApi } from '../services/api';

export const useSalesStore = create((set, get) => ({
  sales: [],
  currentSale: null,
  cart: [],
  loading: false,
  error: null,

  fetchSales: async (params) => {
    set({ loading: true, error: null });
    try {
      const sales = await saleApi.list(params);
      set({ sales, loading: false });
      return sales;
    } catch (error) {
      set({ loading: false, error: error.userMessage || 'Error al cargar ventas' });
      throw error;
    }
  },

  fetchSale: async (id) => {
    set({ loading: true, error: null });
    try {
      const sale = await saleApi.get(id);
      set({ currentSale: sale, loading: false });
      return sale;
    } catch (error) {
      set({ loading: false, error: error.userMessage || 'Error al cargar la venta' });
      throw error;
    }
  },

  createSale: async (payload) => {
    set({ loading: true, error: null });
    try {
      const sale = await saleApi.create(payload);
      set({ currentSale: sale, loading: false });
      // Elimina la venta creada del listado precargado para que no quede obsoleto
      set((s) => ({ sales: [sale, ...s.sales].filter((x) => x.id !== undefined) }));
      return sale;
    } catch (error) {
      set({ loading: false, error: error.userMessage || 'Error al registrar la venta' });
      throw error;
    }
  },

  // ------------------- Carrito POS -------------------
  addToCart: (product, quantity = 1) => {
    const { cart } = get();
    const existing = cart.find((i) => i.product.id === product.id);
    if (existing) {
      set({
        cart: cart.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        ),
      });
    } else {
      set({
        cart: [
          ...cart,
          {
            product,
            quantity,
            unit_price: Number(product.price) || 0,
          },
        ],
      });
    }
  },

  updateCartItem: (productId, quantity) => {
    set({
      cart: get()
        .cart.map((i) =>
          i.product.id === productId ? { ...i, quantity: Number(quantity) } : i
        )
        .filter((i) => i.quantity > 0),
    });
  },

  removeCartItem: (productId) => {
    set({ cart: get().cart.filter((i) => i.product.id !== productId) });
  },

  clearCart: () => set({ cart: [] }),
}));
