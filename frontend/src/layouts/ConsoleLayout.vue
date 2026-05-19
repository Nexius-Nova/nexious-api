<template>
  <div class="console-layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed }">
      <div class="sidebar-header">
        <router-link to="/console" class="sidebar-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="9"></rect>
            <rect x="14" y="3" width="7" height="5"></rect>
            <rect x="14" y="12" width="7" height="9"></rect>
            <rect x="3" y="16" width="7" height="5"></rect>
          </svg>
          <span>控制台</span>
        </router-link>
        <button class="collapse-btn" @click="collapsed = !collapsed" :title="collapsed ? '展开侧边栏' : '折叠侧边栏'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline v-if="collapsed" points="9 18 15 12 9 6"/>
            <polyline v-else points="15 18 9 12 15 6"/>
          </svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
          :title="collapsed ? item.label : undefined"
        >
          <div class="nav-indicator"></div>
          <component :is="item.icon" class="nav-icon" />
          <span class="nav-label">{{ item.label }}</span>
        </router-link>

        <!-- Admin-only nav items -->
        <template v-if="authStore.isAdmin">
          <div class="nav-divider"></div>
          <router-link
            v-for="item in adminNavItems"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: isActive(item.path) }"
            :title="collapsed ? item.label : undefined"
          >
            <div class="nav-indicator"></div>
            <component :is="item.icon" class="nav-icon" />
            <span class="nav-label">{{ item.label }}</span>
          </router-link>
        </template>
      </nav>

      <div class="sidebar-footer">
        <router-link to="/" class="back-link" :title="collapsed ? '返回首页' : undefined">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
          <span>返回首页</span>
        </router-link>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="console-main">
      <div class="scroll-area">
        <div class="content-container">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../store/auth';

const route = useRoute();
const collapsed = ref(false);
const authStore = useAuthStore();

const isActive = (path: string) => {
  if (path === '/console') return route.path === '/console';
  return route.path.startsWith(path);
};

const adminNavItems = [
  {
    path: '/console/users',
    label: '用户管理',
    icon: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }),
      h('circle', { cx: 9, cy: 7, r: 4 }),
      h('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }),
      h('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' }),
    ])
  },
];

const navItems = [
  {
    path: '/console',
    label: '数据看板',
    icon: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('rect', { x: 3, y: 3, width: 7, height: 9 }),
      h('rect', { x: 14, y: 3, width: 7, height: 5 }),
      h('rect', { x: 14, y: 12, width: 7, height: 9 }),
      h('rect', { x: 3, y: 16, width: 7, height: 5 })
    ])
  },
  {
    path: '/console/channels',
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
    path: '/console/tokens',
    label: '令牌管理',
    icon: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('path', { d: 'M21 2l-2 2' }),
      h('circle', { cx: 7, cy: 10, r: 5 }),
      h('path', { d: 'M11 5.5l9 9' }),
      h('path', { d: 'M15.5 10l4.5 4.5V22l-2-2-2 2-2-2-2 2v-4.5l-4.5-4.5' })
    ])
  },
  {
    path: '/console/logs',
    label: '使用日志',
    icon: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
      h('polyline', { points: '14 2 14 8 20 8' }),
      h('line', { x1: 16, y1: 13, x2: 8, y2: 13 }),
      h('line', { x1: 16, y1: 17, x2: 8, y2: 17 }),
      h('polyline', { points: '10 9 9 9 8 9' })
    ])
  },
  {
    path: '/console/pricing',
    label: '模型定价',
    icon: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('line', { x1: 12, y1: 1, x2: 12, y2: 23 }),
      h('path', { d: 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' }),
    ])
  },
  {
    path: '/console/playground',
    label: '操练场',
    icon: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('path', { d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' }),
    ])
  },
  {
    path: '/console/profile',
    label: '个人信息',
    icon: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('path', { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' }),
      h('circle', { cx: 12, cy: 7, r: 4 }),
    ])
  },
];

</script>

<style scoped>
.console-layout {
  display: flex;
  height: 100%;
  width: 100%;
}

/* ============ Sidebar ============ */
.sidebar {
  width: 220px;
  background-color: var(--bg-sidebar);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.sidebar.collapsed {
  width: 56px;
}

.sidebar-header {
  padding: 20px 20px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar.collapsed .sidebar-header {
  padding: 20px 8px 12px;
  flex-direction: column;
  gap: 12px;
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  text-decoration: none;
  white-space: nowrap;
}

.sidebar-title span {
  transition: opacity 0.2s;
}

.sidebar.collapsed .sidebar-title span {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

.sidebar-title svg {
  color: var(--accent-blue);
  flex-shrink: 0;
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.collapse-btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
  border-color: var(--border);
}

.sidebar.collapsed .collapse-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
}

.sidebar-nav {
  flex: 1;
  padding: 4px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.sidebar.collapsed .sidebar-nav {
  padding: 4px 6px 12px;
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
  text-decoration: none;
  transition: all 0.15s ease;
  overflow: hidden;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 10px 0;
  gap: 0;
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
  height: 18px;
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
  white-space: nowrap;
  transition: opacity 0.15s;
}

.sidebar.collapsed .nav-label {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

.nav-divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 6px 4px;
}

.sidebar-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--border-subtle);
}

.sidebar.collapsed .sidebar-footer {
  padding: 14px 8px;
  display: flex;
  justify-content: center;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.15s;
  white-space: nowrap;
}

.sidebar.collapsed .back-link {
  justify-content: center;
}

.sidebar.collapsed .back-link span {
  display: none;
}

.back-link:hover {
  color: var(--accent-blue);
}

/* ============ Console Main ============ */
.console-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
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

/* Transitions */
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
