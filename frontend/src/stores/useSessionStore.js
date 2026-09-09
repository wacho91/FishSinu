import { create } from 'zustand';
import { companyApi, profileApi } from '../services/api';

export const useSessionStore = create((set, get) => ({
  company: null,
  profiles: [],
  currentProfile: null,
  loading: false,
  error: null,

  fetchCompany: async () => {
    set({ loading: true, error: null });
    try {
      const company = await companyApi.get();
      set({ company, loading: false });
    } catch (error) {
      if (error.response && error.response.status === 404) {
        set({ company: null, loading: false, error: null });
        return;
      }
      set({ error: error.userMessage || 'No se pudo cargar la empresa', loading: false });
      throw error;
    }
  },

  fetchProfiles: async () => {
    set({ loading: true, error: null });
    try {
      const profiles = await profileApi.list();
      let currentProfile = get().currentProfile;
      if (!currentProfile && profiles.length > 0) {
        currentProfile = profiles[0];
      } else if (currentProfile) {
        const stillExists = profiles.find((p) => p.id === currentProfile.id);
        currentProfile = stillExists || profiles[0] || null;
      }
      set({ profiles, currentProfile, loading: false });
      return profiles;
    } catch (error) {
      set({ error: error.userMessage || 'No se pudieron cargar los perfiles', loading: false });
      throw error;
    }
  },

  setCurrentProfile: (profile) => {
    set({ currentProfile: profile });
  },
}));
