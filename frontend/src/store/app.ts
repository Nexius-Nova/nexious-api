import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

function detectSystemTheme(): 'dark' | 'light' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
}

export const useAppStore = defineStore('app', () => {
  const storedTheme = localStorage.getItem('theme');
  const theme = ref<'dark' | 'light'>(
    storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : detectSystemTheme(),
  );

  // Sidebar collapsed state (shared with ConsoleLayout)
  const sidebarCollapsed = ref(
    localStorage.getItem('sidebar_collapsed') === 'true',
  );

  // document.title management
  const pageTitle = ref('');

  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark';
  };

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  };

  const setPageTitle = (title: string) => {
    pageTitle.value = title;
    document.title = title ? `${title} - Nexious API` : 'Nexious API';
  };

  watch(theme, (newTheme) => {
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  }, { immediate: true });

  watch(sidebarCollapsed, (val) => {
    localStorage.setItem('sidebar_collapsed', String(val));
  });

  // Listen for system theme changes
  if (typeof window !== 'undefined' && window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        theme.value = e.matches ? 'dark' : 'light';
      }
    });
  }

  return {
    theme,
    sidebarCollapsed,
    pageTitle,
    toggleTheme,
    toggleSidebar,
    setPageTitle,
  };
});
