<template>
  <div class="layout-wrapper">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <div class="logo-text">
            <span class="logo-name">Nexious API</span>
            <span class="logo-version">v0.1.0</span>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-group">
          <div class="nav-group-title">管理</div>
          <router-link
            v-for="item in mainNav"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: isActive(item.path) }"
          >
            <div class="nav-indicator"></div>
            <component :is="item.icon" class="nav-icon" />
            <span class="nav-label">{{ item.label }}</span>
          </router-link>
        </div>

        <div class="nav-group">
          <div class="nav-group-title">系统</div>
          <router-link
            v-for="item in sysNav"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: isActive(item.path) }"
          >
            <div class="nav-indicator"></div>
            <component :is="item.icon" class="nav-icon" />
            <span class="nav-label">{{ item.label }}</span>
          </router-link>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="status-indicator">
          <span class="status-pulse"></span>
          <span class="status-text">所有系统正常</span>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <header class="top-header">
        <div class="header-left">
          <div class="breadcrumb">
            <span class="breadcrumb-item">Nexious API</span>
            <span class="breadcrumb-sep">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </span>
            <span class="breadcrumb-item current">{{ currentPageTitle }}</span>
          </div>
        </div>
        <div class="header-right">
          <button
            class="header-icon-btn"
            @click="appStore.toggleTheme"
            :title="appStore.theme === 'dark' ? '切换到明亮模式' : '切换到暗黑模式'"
          >
            <svg v-if="appStore.theme === 'dark'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </button>
          <div class="user-profile">
            </div>
        </div>
      </header>

      <div class="scroll-area">
        <div class="content-container">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </div>
    </main>
  </div>
  <ToastContainer />
</template>

<script setup lang="ts">
import { computed, h } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '../store/app';
import ToastContainer from '../components/ToastContainer.vue';

const route = useRoute();
const appStore = useAppStore();

const isActive = (path: string) => {
  if (path === '/') return route.path === '/';
  return route.path.startsWith(path);
};

const mainNav = [
  {
    path: '/',
    label: '控制面板',
    icon: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('rect', { x: 3, y: 3, width: 7, height: 9 }),
      h('rect', { x: 14, y: 3, width: 7, height: 5 }),
      h('rect', { x: 14, y: 12, width: 7, height: 9 }),
      h('rect', { x: 3, y: 16, width: 7, height: 5 })
    ])
  },
  {
    path: '/channels',
    label: '渠道管理',
    icon: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('path', { d: 'M18 8a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8Z' }),
      h('path', { d: 'M10 12h.01' }),
      h('path', { d: 'M14 12h.01' }),
      h('path', { d: 'M18 12h4' }),
      h('path', { d: 'M21.5 10V14' })
    ])
  },
  {
    path: '/tokens',
    label: '令牌管理',
    icon: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('path', { d: 'M21 2l-2 2' }),
      h('circle', { cx: 7, cy: 10, r: 5 }),
      h('path', { d: 'M11 5.5l9 9' }),
      h('path', { d: 'M15.5 10l4.5 4.5V22l-2-2-2 2-2-2-2 2v-4.5l-4.5-4.5' })
    ])
  },
  {
    path: '/logs',
    label: '日志查询',
    icon: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
      h('polyline', { points: '14 2 14 8 20 8' }),
      h('line', { x1: 16, y1: 13, x2: 8, y2: 13 }),
      h('line', { x1: 16, y1: 17, x2: 8, y2: 17 }),
      h('polyline', { points: '10 9 9 9 8 9' })
    ])
  }
];

const sysNav = [
  {
    path: '/models',
    label: '模型广场',
    icon: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('circle', { cx: 12, cy: 12, r: 10 }),
      h('path', { d: 'M12 6v6l4 2' })
    ])
  },
  {
    path: '/api-docs',
    label: 'API 文档',
    icon: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
      h('polyline', { points: '14 2 14 8 20 8' }),
      h('line', { x1: 16, y1: 13, x2: 8, y2: 13 }),
      h('line', { x1: 16, y1: 17, x2: 8, y2: 17 }),
      h('circle', { cx: 10, cy: 15, r: 1 }),
      h('circle', { cx: 14, cy: 15, r: 1 })
    ])
  }
];

const currentPageTitle = computed(() => {
  const all = [...mainNav, ...sysNav];
  const item = all.find(i => i.path === route.path);
  return item ? item.label : '控制面板';
});
</script>

<style scoped>
.layout-wrapper {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: var(--bg-app);
}

/* ============ Sidebar ============ */
.sidebar {
  width: 240px;
  background-color: var(--bg-sidebar);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  z-index: 10;
}

.sidebar-header {
  padding: 20px 20px 16px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--accent-blue), #6366f1);
  border-radius: 10px;
  color: white;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.logo-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.logo-version {
  font-size: 0.65rem;
  color: var(--text-muted);
  margin-top: 1px;
}

.sidebar-nav {
  flex: 1;
  padding: 4px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}

.nav-group-title {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0 12px;
  margin-bottom: 4px;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.15s ease;
  overflow: hidden;
}

.nav-item:hover {
  background-color: var(--bg-card-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(99, 102, 241, 0.06));
  color: var(--accent-blue);
}

.nav-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  border-radius: 0 3px 3px 0;
  background: var(--accent-blue);
  transition: height 0.2s ease;
}

.nav-item.active .nav-indicator {
  height: 20px;
}

.nav-icon {
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.nav-item.active .nav-icon {
  opacity: 1;
}

.nav-label {
  flex: 1;
}

.nav-badge {
  font-size: 0.65rem;
  padding: 1px 6px;
  border-radius: 10px;
  background: var(--accent-blue);
  color: white;
  font-weight: 600;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-subtle);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-green);
  box-shadow: 0 0 6px var(--accent-green);
  animation: pulse 2s ease-in-out infinite;
}

.status-text {
  font-size: 0.75rem;
  color: var(--text-muted);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ============ Main Content ============ */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.top-header {
  height: 60px;
  padding: 0 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-app);
  backdrop-filter: blur(12px);
  z-index: 5;
}

.header-left {
  display: flex;
  align-items: center;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
}

.breadcrumb-item {
  color: var(--text-muted);
}

.breadcrumb-item.current {
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.9rem;
}

.breadcrumb-sep {
  color: var(--text-muted);
  opacity: 0.4;
  display: flex;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: var(--text-secondary);
  transition: all 0.15s;
}

.header-icon-btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px 6px 6px;
  border-radius: 8px;
  cursor: default;
  transition: background 0.15s;
}

.user-profile:hover {
  background: var(--bg-card-hover);
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--accent-blue), #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
}

.user-role {
  font-size: 0.65rem;
  color: var(--text-muted);
}

.scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 28px;
}

.content-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Page Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
