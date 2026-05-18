<template>
  <GlobalLoader />
  <router-view />
</template>

<script setup lang="ts">
import GlobalLoader from './components/GlobalLoader.vue';
import { useAppStore } from './store/app';

useAppStore();
</script>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>
