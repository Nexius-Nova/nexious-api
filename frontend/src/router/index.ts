import { createRouter, createWebHistory } from 'vue-router';
import { watch } from 'vue';
import { useLoader } from '../composables/useLoader';
import AppLayout from '../layouts/AppLayout.vue';
import ConsoleLayout from '../layouts/ConsoleLayout.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'),
    },
    {
      path: '/register',
      redirect: '/login',
    },
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: false },
      children: [
        {
          path: '',
          name: 'Home',
          component: () => import('../views/Home.vue'),
        },
        {
          path: 'console',
          component: ConsoleLayout,
          meta: { requiresAuth: true },
          children: [
            {
              path: '',
              name: 'Dashboard',
              component: () => import('../views/Dashboard.vue'),
            },
            {
              path: 'channels',
              name: 'Channels',
              component: () => import('../views/Channels.vue'),
            },
            {
              path: 'tokens',
              name: 'Tokens',
              component: () => import('../views/Tokens.vue'),
            },
            {
              path: 'users',
              name: 'Users',
              meta: { requiresAdmin: true },
              component: () => import('../views/Users.vue'),
            },
            {
              path: 'profile',
              name: 'Profile',
              component: () => import('../views/Profile.vue'),
            },
            {
              path: 'logs',
              name: 'Logs',
              component: () => import('../views/Logs.vue'),
            },
            {
              path: 'playground',
              name: 'Playground',
              component: () => import('../views/Playground.vue'),
            },
            {
              path: 'pricing',
              name: 'Pricing',
              component: () => import('../views/Pricing.vue'),
            },
          ],
        },
        {
          path: 'models',
          name: 'Models',
          component: () => import('../views/Models.vue'),
        },
        {
          path: 'api-docs',
          name: 'ApiDocs',
          component: () => import('../views/ApiDocs.vue'),
        },
      ],
    },
  ],
});

const loader = useLoader();

router.beforeEach(async (to, _from, next) => {
  loader.start();

  // Dynamically import auth store to avoid circular dependency
  const { useAuthStore } = await import('../store/auth');
  const authStore = useAuthStore();

  // Wait for auth restore to complete before making decisions
  if (!authStore.authReady) {
    await new Promise<void>((resolve) => {
      const unwatch = watch(
        () => authStore.authReady,
        (ready) => {
          if (ready) {
            unwatch();
            resolve();
          }
        },
      );
    });
  }

  // Redirect console routes without auth to login
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
    return;
  }

  // Redirect non-admin from admin routes
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next({ name: 'Dashboard' });
    return;
  }

  // Redirect authenticated users away from auth pages
  if (authStore.isAuthenticated && to.name === 'Login') {
    next({ name: 'Dashboard' });
    return;
  }

  next();
});

router.afterEach(() => {
  loader.stop();
});

export default router;
