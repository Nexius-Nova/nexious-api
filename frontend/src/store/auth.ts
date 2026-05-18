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

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'admin' || user.value?.role === 'super_admin');
  const isSuperAdmin = computed(() => user.value?.role === 'super_admin');

  // Restore session on load
  if (token.value) {
    fetchMe();
  } else {
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
    return res;
  }

  async function fetchMe() {
    try {
      user.value = await authApi.me();
    } catch {
      logout();
    } finally {
      authReady.value = true;
    }
  }

  function logout() {
    token.value = '';
    user.value = null;
    localStorage.removeItem('auth_token');
  }

  return {
    user,
    token,
    authReady,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    login,
    register,
    fetchMe,
    logout,
  };
});
