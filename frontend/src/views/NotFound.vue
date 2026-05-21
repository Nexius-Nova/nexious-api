<template>
  <div class="not-found">
    <div class="not-found-content">
      <h1>404</h1>
      <p>页面不存在</p>
      <router-link to="/" class="btn-home">返回首页</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}
.not-found-content h1 {
  font-size: 4rem;
  font-weight: 700;
  color: var(--text-muted);
  margin-bottom: 8px;
}
.not-found-content p {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 24px;
}
.btn-home {
  display: inline-block;
  padding: 10px 24px;
  background: var(--accent-blue);
  color: #fff;
  border-radius: var(--radius-md);
  text-decoration: none;
  font-weight: 600;
  transition: filter 0.15s;
}
.btn-home:hover {
  filter: brightness(1.1);
}
</style>
