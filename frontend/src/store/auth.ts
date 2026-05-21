import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '../api/auth';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string>(localStorage.getItem('auth_token') || '');
  const authReady = ref(false);

  // fetchMe deduplication
  let fetchMePromise: Promise<void> | null = null;

  const isTokenExpired = computed(() => {
    if (!token.value) return false;
    try {
      const payload = JSON.parse(atob(token.value.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch { return false; }
  });

  const isAuthenticated = computed(() => {
    if (!token.value) return false;
    return !isTokenExpired.value;
  });
  const isAdmin = computed(() => user.value?.role === 'admin' || user.value?.role === 'super_admin');
  const isSuperAdmin = computed(() => user.value?.role === 'super_admin');

  // Restore session on load
  if (token.value && isAuthenticated.value) {
    fetchMe();
  } else {
    if (token.value && !isAuthenticated.value) {
      // Token expired, clean up
      token.value = '';
      localStorage.removeItem('auth_token');
    }
    authReady.value = true;
  }

  async function login(username: string, password: string) {
    const res = await authApi.login(username, password);
    token.value = res.access_token;
    user.value = res.user;
    localStorage.setItem('auth_token', res.access_token);
    return res;
  }

  async function register(username: string, email: string, password: string, code: string) {
    const res = await authApi.register(username, email, password, code);
    // Auto-login after successful registration:
    // The register response should include user info.
    // If it does, set the user directly. Otherwise, transparently login.
    if (res && (res as any).id) {
      // We need a token to consider authenticated.
      // Try to login with the credentials used for registration.
      try {
        await login(username, password);
      } catch {
        // Login after register may fail (e.g., if email verification needed).
        // Store user info but require explicit login.
        user.value = { id: (res as any).id, username, email, role: (res as any).role || 'user' };
      }
    }
    return res;
  }

  async function fetchMe() {
    // Deduplicate fetchMe calls
    if (fetchMePromise) return fetchMePromise;
    fetchMePromise = (async () => {
      try {
        user.value = await authApi.me();
      } catch {
        logout();
      } finally {
        authReady.value = true;
        fetchMePromise = null;
      }
    })();
    return fetchMePromise;
  }

  function logout() {
    token.value = '';
    user.value = null;
    localStorage.removeItem('auth_token');
    fetchMePromise = null;
  }

  return {
    user,
    token,
    authReady,
    isTokenExpired,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    login,
    register,
    fetchMe,
    logout,
  };
});
