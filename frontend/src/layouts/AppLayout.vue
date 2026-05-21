<template>
  <div class="app-shell">
    <!-- Top Navigation -->
    <header class="topnav">
      <div class="topnav-inner">
        <div class="topnav-left">
          <router-link to="/" class="topnav-logo">
            <div class="logo-icon">
              <img
                src="../assets/icon.png"
                alt="Nexious"
                width="20"
                height="20"
              />
            </div>
            <span class="logo-text">Nexious API</span>
          </router-link>
        </div>

        <nav class="topnav-nav" :class="{ 'mobile-open': mobileMenuOpen }">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="topnav-link"
            :class="{ active: isActive(item.path) }"
            @click="mobileMenuOpen = false"
          >
            <component :is="item.icon" class="tn-icon" />
            <span>{{ item.label }}</span>
          </router-link>
        </nav>

        <!-- Mobile overlay -->
        <div v-if="mobileMenuOpen" class="mobile-nav-overlay" @click="mobileMenuOpen = false"></div>

        <div class="topnav-right">
          <!-- Hamburger button (mobile only) -->
          <button
            class="mobile-menu-btn"
            @click="mobileMenuOpen = !mobileMenuOpen"
            aria-label="Toggle menu"
          >
            <svg v-if="!mobileMenuOpen" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <button
            class="topnav-icon-btn"
            @click="appStore.toggleTheme"
            :title="
              appStore.theme === 'dark' ? '切换到明亮模式' : '切换到暗黑模式'
            "
          >
            <svg
              v-if="appStore.theme === 'dark'"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
            <svg
              v-else
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </button>
          <template v-if="authStore.isAuthenticated">
            <!-- User dropdown -->
            <div class="user-menu">
              <button
                class="user-trigger"
                @click="userMenuOpen = !userMenuOpen"
              >
                <div class="user-avatar">
                  {{ authStore.user?.username?.[0]?.toUpperCase() }}
                </div>
                <span class="user-name-display">{{
                  authStore.user?.username
                }}</span>
                <svg
                  class="user-chevron"
                  :class="{ open: userMenuOpen }"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <transition name="dropdown">
                <div v-if="userMenuOpen" class="user-dropdown">
                  <div class="dropdown-hd">
                    <span class="dropdown-email">{{
                      authStore.user?.email
                    }}</span>
                    <span
                      class="dropdown-role"
                      :class="{
                        'role-admin': authStore.isAdmin,
                        'role-super': authStore.isSuperAdmin,
                      }"
                      >{{
                        authStore.isSuperAdmin
                          ? '超级管理员'
                          : authStore.isAdmin
                            ? '管理员'
                            : '用户'
                      }}</span
                    >
                  </div>
                  <div class="dropdown-divider"></div>
                  <router-link
                    to="/console/profile"
                    class="dropdown-item"
                    @click="userMenuOpen = false"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                      ></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>个人信息</span>
                  </router-link>
                  <button
                    class="dropdown-item dropdown-item-danger"
                    @click="handleLogout"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span>退出登录</span>
                  </button>
                </div>
              </transition>
            </div>
          </template>
          <template v-else>
            <router-link
              to="/login"
              class="topnav-link"
              style="
                background: var(--accent-blue);
                color: #fff;
                border-radius: 8px;
                padding: 6px 14px;
              "
              >登录 / 注册</router-link
            >
          </template>
        </div>
      </div>
    </header>

    <!-- Page Content -->
    <main class="app-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
  <ToastContainer />
</template>

<script setup lang="ts">
import { h, ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppStore } from '../store/app';
import { useAuthStore } from '../store/auth';
import ToastContainer from '../components/ToastContainer.vue';

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const authStore = useAuthStore();

const userMenuOpen = ref(false);
const mobileMenuOpen = ref(false);

function closeUserMenu(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest('.user-menu')) {
    userMenuOpen.value = false;
  }
}

function handleLogout() {
  userMenuOpen.value = false;
  authStore.logout();
  router.push('/');
}

onMounted(() => document.addEventListener('click', closeUserMenu));
onUnmounted(() => document.removeEventListener('click', closeUserMenu));

const isActive = (path: string) => {
  if (path === '/') return route.path === '/';
  return route.path.startsWith(path);
};

const navItems = [
  {
    path: '/',
    label: '首页',
    icon: () =>
      h(
        'svg',
        {
          width: 16,
          height: 16,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': 2,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        },
        [
          h('path', { d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }),
          h('polyline', { points: '9 22 9 12 15 12 15 22' }),
        ],
      ),
  },
  {
    path: '/console',
    label: '控制台',
    icon: () =>
      h(
        'svg',
        {
          width: 16,
          height: 16,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': 2,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        },
        [
          h('rect', { x: 3, y: 3, width: 7, height: 9 }),
          h('rect', { x: 14, y: 3, width: 7, height: 5 }),
          h('rect', { x: 14, y: 12, width: 7, height: 9 }),
          h('rect', { x: 3, y: 16, width: 7, height: 5 }),
        ],
      ),
  },
  {
    path: '/models',
    label: '模型广场',
    icon: () =>
      h(
        'svg',
        {
          width: 16,
          height: 16,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': 2,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        },
        [
          h('circle', { cx: 12, cy: 12, r: 10 }),
          h('path', { d: 'M12 6v6l4 2' }),
        ],
      ),
  },
  {
    path: '/api-docs',
    label: 'API 文档',
    icon: () =>
      h(
        'svg',
        {
          width: 16,
          height: 16,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': 2,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        },
        [
          h('path', {
            d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
          }),
          h('polyline', { points: '14 2 14 8 20 8' }),
          h('line', { x1: 16, y1: 13, x2: 8, y2: 13 }),
          h('line', { x1: 16, y1: 17, x2: 8, y2: 17 }),
        ],
      ),
  },
];
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: var(--bg-app);
}

/* ============ Top Nav ============ */
.topnav {
  height: 52px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-sidebar);
  flex-shrink: 0;
  z-index: 20;
}

.topnav-inner {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 32px;
}

.topnav-left {
  flex-shrink: 0;
}

.topnav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.topnav-logo .logo-icon {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.logo-icon img {
  width: 30px;
  height: 30px;
}

.topnav-logo .logo-text {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.topnav-nav {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
}

.topnav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.15s;
}

.topnav-link:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.topnav-link.active {
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent-blue);
}

.topnav-link.active .tn-icon {
  opacity: 1;
}

.tn-icon {
  opacity: 0.6;
  transition: opacity 0.15s;
}

.topnav-right {
  display: flex;
  align-items: center;
  gap: 16px;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: -0.02em;
  cursor: pointer;
  flex-shrink: 0;
}

.topnav-icon-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: var(--text-secondary);
  transition: all 0.15s;
}

.topnav-icon-btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

/* ============ Content ============ */
.app-content {
  flex: 1;
  overflow-y: auto;
}

/* ============ User Dropdown ============ */
.user-menu {
  position: relative;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px 5px 5px;
  border-radius: 8px;
  color: var(--text-secondary);
  transition: all 0.15s;
  cursor: pointer;
}

.user-trigger:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: linear-gradient(135deg, var(--accent-blue), #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.user-name-display {
  font-size: 0.83rem;
  font-weight: 500;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-chevron {
  transition: transform 0.2s;
  opacity: 0.5;
}

.user-chevron.open {
  transform: rotate(180deg);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  z-index: 100;
}

.dropdown-hd {
  padding: 14px 16px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dropdown-email {
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.dropdown-role {
  font-size: 0.68rem;
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.dropdown-role::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-muted);
}

.dropdown-role.role-admin::before {
  background: var(--accent-blue);
  box-shadow: 0 0 6px var(--accent-blue);
}

.dropdown-role.role-super::before {
  background: #f59e0b;
  box-shadow: 0 0 6px #f59e0b;
}

.dropdown-divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 0 12px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  font-size: 0.83rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.12s;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-family: inherit;
}

.dropdown-item:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.dropdown-item-danger:hover {
  background: rgba(239, 68, 68, 0.08);
  color: var(--accent-red);
}

/* Dropdown transition */
.dropdown-enter-active {
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.dropdown-leave-active {
  transition: all 0.12s ease-in;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-6px) scale(0.96);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.97);
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ============ Mobile Menu ============ */
.mobile-menu-btn {
  display: none;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  flex-shrink: 0;
}

.mobile-menu-btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.mobile-nav-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 18;
}

@media (max-width: 768px) {
  .mobile-menu-btn {
    display: flex;
  }

  .topnav-nav {
    position: fixed;
    top: 52px;
    left: 0;
    right: 0;
    background: var(--bg-sidebar);
    border-bottom: 1px solid var(--border-subtle);
    flex-direction: column;
    padding: 12px 16px;
    gap: 2px;
    z-index: 19;
    transform: translateY(-100%);
    opacity: 0;
    transition: transform 0.2s ease, opacity 0.2s ease;
    pointer-events: none;
  }

  .topnav-nav.mobile-open {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }

  .topnav-nav .topnav-link {
    width: 100%;
    padding: 12px 14px;
  }

  .mobile-nav-overlay {
    display: block;
  }

  .topnav-right .topnav-link[style] {
    display: none;
  }
}
</style>
