import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';

export const ROLES = {
  ADMIN: 'admin',
  CODER: 'coder',
  QA: 'qa'
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      loading: false,
      error: null,
      initialized: false,

      // Computed
      isAuthenticated: () => !!get().user,

      // Role checks
      hasRole: (roles) => {
        const user = get().user;
        if (!user) return false;
        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.includes(user.role);
      },

      isAdmin: () => get().hasRole(ROLES.ADMIN),
      isCoder: () => get().hasRole([ROLES.ADMIN, ROLES.CODER]),
      isQA: () => get().hasRole([ROLES.ADMIN, ROLES.QA]),

      // Actions
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Initialize - verify stored token
      initialize: async () => {
        const { token } = get();

        if (!token) {
          set({ initialized: true });
          return;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            const data = await response.json();
            set({ user: data.user, initialized: true });
          } else {
            // Token invalid
            set({ user: null, token: null, initialized: true });
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ user: null, token: null, initialized: true });
        }
      },

      // Login
      login: async (userId, password) => {
        set({ loading: true, error: null });

        try {
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, password })
          });

          const data = await response.json();

          if (!response.ok) {
            set({ loading: false, error: data.error || 'Login failed' });
            return { success: false, error: data.error };
          }

          set({
            user: data.user,
            token: data.token,
            loading: false,
            error: null
          });

          return { success: true, user: data.user };

        } catch (error) {
          set({ loading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      // Logout
      logout: () => {
        set({ user: null, token: null, error: null });
      },

      // Get auth headers for API requests
      getAuthHeaders: () => {
        const token = get().token;
        return token ? { 'Authorization': `Bearer ${token}` } : {};
      },

      // Authenticated fetch wrapper
      authFetch: async (url, options = {}) => {
        const token = get().token;

        const headers = {
          ...options.headers,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };

        const response = await fetch(url, { ...options, headers });

        // Handle token expiration
        if (response.status === 401) {
          const data = await response.json().catch(() => ({}));
          if (data.code === 'TOKEN_EXPIRED') {
            get().logout();
            throw new Error('Session expired. Please login again.');
          }
        }

        return response;
      },

      // Change password
      changePassword: async (currentPassword, newPassword) => {
        try {
          const response = await get().authFetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword })
          });

          const data = await response.json();

          if (!response.ok) {
            return { success: false, error: data.error };
          }

          return { success: true };

        } catch (error) {
          return { success: false, error: error.message };
        }
      }
    }),
    {
      name: 'medcode-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user
      })
    }
  )
);

// Selector hooks for convenience
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => !!state.user);
export const useAuthLoading = () => useAuthStore((state) => state.loading);
export const useAuthError = () => useAuthStore((state) => state.error);
