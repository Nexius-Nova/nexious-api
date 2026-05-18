<template>
  <div class="nexious-home">
    <!-- Ambient background orbs -->
    <div class="bg-orbs">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
    </div>

    <!-- Grid overlay -->
    <div class="grid-overlay"></div>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-rail">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          Nexious API v0.1.0 · 系统运行中
        </div>

        <h1 class="hero-title">
          <span class="title-line">统一 AI 模型</span>
          <span class="title-line accent">网关控制中心</span>
        </h1>

        <p class="hero-desc">
          集中管理您的 LLM 渠道、API 令牌和请求监控，
          一站式接入多种大语言模型。
        </p>

        <div class="hero-actions">
          <router-link to="/console" class="btn-glow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
            进入控制台
          </router-link>
          <router-link to="/api-docs" class="btn-outline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            查看API 文档
          </router-link>
        </div>
      </div>

      <!-- Stats Terminal -->
      <div class="stats-terminal">
        <div class="terminal-header">
          <div class="terminal-dots">
            <span class="tdot tdot-r"></span>
            <span class="tdot tdot-y"></span>
            <span class="tdot tdot-g"></span>
          </div>
          <span class="terminal-title">nexious@status:~$</span>
        </div>
        <div class="terminal-body">
          <div class="stat-row" style="--idx: 0">
            <span class="stat-key"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> 今日请求</span>
            <span class="stat-val accent-cyan">{{ animatedStats.totalRequests }}</span>
          </div>
          <div class="stat-row" style="--idx: 1">
            <span class="stat-key"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> 今日消耗</span>
            <span class="stat-val accent-green">{{ formatNum(animatedStats.todayTokens) }}</span>
          </div>
          <div class="stat-row" style="--idx: 2">
            <span class="stat-key"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> 活跃渠道</span>
            <span class="stat-val accent-amber">{{ channelCount }}</span>
          </div>
          <div class="stat-row" style="--idx: 3">
            <span class="stat-key"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> 系统状态</span>
            <span class="stat-val accent-green">online</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Quick Stats Bar -->
    <section class="quick-stats">
      <div class="qs-item">
        <span class="qs-num accent-cyan">{{ formatNum(stats.totalTokens) }}</span>
        <span class="qs-label">累计消耗</span>
      </div>
      <div class="qs-divider"></div>
      <div class="qs-item">
        <span class="qs-num accent-green">{{ formatNum(stats.todayTokens) }}</span>
        <span class="qs-label">今日消耗</span>
      </div>
      <div class="qs-divider"></div>
      <div class="qs-item">
        <span class="qs-num accent-amber">{{ stats.totalRequests }}</span>
        <span class="qs-label">累计请求</span>
      </div>
      <div class="qs-divider"></div>
      <div class="qs-item">
        <span class="qs-num accent-cyan">{{ channelCount }}</span>
        <span class="qs-label">活跃渠道</span>
      </div>
      <div class="qs-divider"></div>
      <div class="qs-item">
        <span class="qs-num accent-green">正常</span>
        <span class="qs-label">系统状态</span>
      </div>
    </section>

    <!-- Feature Grid -->
    <section class="feature-grid">
      <router-link to="/console" class="feature-tile" style="--hue: 190">
        <div class="tile-glow"></div>
        <div class="tile-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
        </div>
        <div class="tile-text">
          <h3 class="tile-title">数据看板</h3>
          <p class="tile-desc">实时请求统计、令牌消耗趋势和模型使用分布</p>
        </div>
        <div class="tile-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </div>
      </router-link>

      <router-link to="/console/channels" class="feature-tile" style="--hue: 160">
        <div class="tile-glow"></div>
        <div class="tile-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8Z"></path><path d="M10 12h.01"></path><path d="M14 12h.01"></path></svg>
        </div>
        <div class="tile-text">
          <h3 class="tile-title">渠道管理</h3>
          <p class="tile-desc">配置 OpenAI、Claude、Gemini 等多种 AI 提供商渠道</p>
        </div>
        <div class="tile-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </div>
      </router-link>

      <router-link to="/console/tokens" class="feature-tile" style="--hue: 40">
        <div class="tile-glow"></div>
        <div class="tile-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 2l-2 2"></path><circle cx="7" cy="10" r="5"></circle><path d="M11 5.5l9 9"></path><path d="M15.5 10l4.5 4.5V22l-2-2-2 2-2-2-2 2v-4.5l-4.5-4.5"></path></svg>
        </div>
        <div class="tile-text">
          <h3 class="tile-title">令牌管理</h3>
          <p class="tile-desc">创建和管理 API 访问令牌，设置额度限制和过期时间</p>
        </div>
        <div class="tile-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </div>
      </router-link>

      <router-link to="/models" class="feature-tile" style="--hue: 280">
        <div class="tile-glow"></div>
        <div class="tile-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>
        </div>
        <div class="tile-text">
          <h3 class="tile-title">模型广场</h3>
          <p class="tile-desc">浏览所有渠道支持的模型，查看详情和可用状态</p>
        </div>
        <div class="tile-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </div>
      </router-link>
    </section>

    <!-- Footer note -->
    <div class="home-footer">
      <span>Nexious API Gateway · 集中管理 · 统一接入</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import api from '../api';

const stats = ref({ totalTokens: 0, todayTokens: 0, totalRequests: 0 });
const channelCount = ref(0);
const animatedStats = ref({ totalRequests: 0, todayTokens: 0 });

const formatNum = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
};

let animFrame: number | null = null;
let mounted = false;

const animateCounters = () => {
  const targetRequests = stats.value.totalRequests;
  const targetTokens = stats.value.todayTokens;
  const duration = 1200;
  const start = performance.now();
  const tick = (now: number) => {
    if (!mounted) return;
    const elapsed = now - start;
    const t = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    animatedStats.value.totalRequests = Math.floor(targetRequests * ease);
    animatedStats.value.todayTokens = Math.floor(targetTokens * ease);
    if (t < 1) animFrame = requestAnimationFrame(tick);
  };
  animFrame = requestAnimationFrame(tick);
};

onMounted(() => {
  mounted = true;
  Promise.all([
    api.get('/logs/stats').then((r) => { stats.value = r.data; }),
    api.get('/channels').then((r) => { channelCount.value = r.data.length; }),
  ]).then(animateCounters).catch(() => {});
});

onUnmounted(() => {
  mounted = false;
  if (animFrame) cancelAnimationFrame(animFrame);
});
</script>

<style scoped>
/* ================================================
   NEXIOUS HOME — Infrastructure Control Center
   ================================================ */

.nexious-home {
  position: relative;
  padding: 40px 56px 32px;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* ---- Ambient Background ---- */
.bg-orbs {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.1;
  animation: orbFloat 14s ease-in-out infinite alternate;
}

.orb-1 {
  width: 480px; height: 480px;
  top: -160px; right: -100px;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.5), transparent 70%);
}

.orb-2 {
  width: 360px; height: 360px;
  bottom: -80px; left: -60px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.4), transparent 70%);
  animation-duration: 18s;
  animation-delay: -6s;
}

.orb-3 {
  width: 240px; height: 240px;
  top: 40%; left: 60%;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.3), transparent 70%);
  animation-duration: 20s;
  animation-delay: -10s;
}

@keyframes orbFloat {
  0%   { transform: translate(0, 0) scale(1); }
  33%  { transform: translate(24px, -16px) scale(1.04); }
  66%  { transform: translate(-16px, 12px) scale(0.96); }
  100% { transform: translate(8px, -8px) scale(1.02); }
}

.grid-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 70% 50% at 50% 40%, black, transparent 65%);
  -webkit-mask-image: radial-gradient(ellipse 70% 50% at 50% 40%, black, transparent 65%);
}

/* ---- Hero Section ---- */
.hero-section {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 40px;
}

.hero-rail {
  flex: 1;
  min-width: 0;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 13px;
  border-radius: 20px;
  font-size: 0.68rem;
  font-weight: 500;
  color: rgba(6, 182, 212, 0.9);
  background: rgba(6, 182, 212, 0.06);
  border: 1px solid rgba(6, 182, 212, 0.13);
  margin-bottom: 18px;
}

.badge-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
  animation: pulse 2s ease-in-out infinite;
}

.hero-title {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-bottom: 14px;
}

.title-line {
  font-size: 2.6rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.15;
  color: var(--text-primary);
}

.title-line.accent {
  background: linear-gradient(135deg, #06b6d4, #818cf8, #06b6d4);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradientShift 6s ease-in-out infinite alternate;
}

.hero-desc {
  font-size: 0.92rem;
  line-height: 1.7;
  color: var(--text-secondary);
  margin-bottom: 26px;
  max-width: 420px;
}

.hero-actions {
  display: flex;
  gap: 10px;
}

/* ---- Buttons ---- */
.btn-glow {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 22px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  text-decoration: none;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.3s;
}

.btn-glow::after {
  content: '';
  position: absolute;
  top: -50%; left: -50%;
  width: 200%; height: 200%;
  background: conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255,255,255,0.08) 60deg, transparent 120deg);
  animation: rotateGlow 4s linear infinite;
  pointer-events: none;
}

.btn-glow:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 24px rgba(6, 182, 212, 0.3);
}

.btn-glow > * { position: relative; z-index: 1; }

.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 22px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
  text-decoration: none;
  transition: all 0.2s;
}

.btn-outline:hover {
  background: rgba(255,255,255,0.03);
  color: var(--text-primary);
  border-color: rgba(6, 182, 212, 0.25);
}

/* ---- Stats Terminal ---- */
.stats-terminal {
  flex-shrink: 0;
  width: 280px;
  border-radius: 10px;
  border: 1px solid rgba(6, 188, 212, 0.1);
  background: rgb(170 171 172 / 25%);
  backdrop-filter: blur(12px);
  overflow: hidden;
}

.terminal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  background: rgba(255,255,255,0.015);
}

.terminal-dots { display: flex; gap: 6px; }
.tdot { width: 7px; height: 7px; border-radius: 50%; }
.tdot-r { background: #ef4444; }
.tdot-y { background: #eab308; }
.tdot-g { background: #22c55e; }

.terminal-title {
  font-size: 0.65rem;
  color: rgba(255,255,255,0.3);
  font-family: var(--font-mono, monospace);
}

.terminal-body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-key {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
}

.stat-key svg { opacity: 0.5; }

.stat-val {
  font-size: 1rem;
  font-weight: 700;
  font-family: var(--font-mono, monospace);
  letter-spacing: -0.02em;
}

.accent-cyan { color: #06b6d4; }
.accent-green { color: #22c55e; }
.accent-amber { color: #eab308; }

/* ---- Quick Stats Bar ---- */
.quick-stats {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 16px 24px;
  border-radius: 10px;
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--border-subtle);
}

.qs-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.qs-num {
  font-size: 1.15rem;
  font-weight: 700;
  font-family: var(--font-mono, monospace);
}

.qs-label {
  font-size: 0.65rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.qs-divider {
  width: 1px;
  height: 28px;
  background: var(--border-subtle);
}

/* ---- Feature Grid ---- */
.feature-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.feature-tile {
  position: relative;
  border-radius: 10px;
  padding: 20px;
  text-decoration: none;
  background: rgba(255,255,255,0.015);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: border-color 0.25s, transform 0.25s, background 0.25s;
}

.feature-tile::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, hsl(var(--hue, 190), 75%, 50%), transparent);
  opacity: 0;
  transition: opacity 0.35s;
}

.feature-tile:hover::before { opacity: 1; }

.feature-tile:hover {
  transform: translateY(-3px);
  border-color: hsla(var(--hue, 190), 75%, 50%, 0.25);
  background: rgba(255,255,255,0.03);
}

.tile-glow {
  position: absolute;
  top: 50%; left: 50%;
  width: 180px; height: 180px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, hsla(var(--hue, 190), 80%, 50%, 0.04), transparent 70%);
  opacity: 0;
  transition: opacity 0.35s;
  pointer-events: none;
}

.feature-tile:hover .tile-glow { opacity: 1; }

.tile-icon {
  width: 36px; height: 36px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: hsl(var(--hue, 190), 80%, 55%);
  background: hsla(var(--hue, 190), 80%, 50%, 0.07);
  transition: background 0.25s;
}

.feature-tile:hover .tile-icon {
  background: hsla(var(--hue, 190), 80%, 50%, 0.14);
}

.tile-text {
  position: relative;
  z-index: 1;
}

.tile-title {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.tile-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.tile-arrow {
  position: absolute;
  bottom: 16px;
  right: 16px;
  color: var(--text-muted);
  opacity: 0;
  transform: translateX(-5px);
  transition: opacity 0.25s, transform 0.25s, color 0.25s;
}

.feature-tile:hover .tile-arrow {
  opacity: 1;
  transform: translateX(0);
  color: hsl(var(--hue, 190), 80%, 55%);
}

/* ---- Footer ---- */
.home-footer {
  position: relative;
  z-index: 1;
  text-align: center;
  font-size: 0.68rem;
  color: var(--text-muted);
  padding: 8px 0 4px;
  opacity: 0.5;
}

/* ---- Animations ---- */
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes rotateGlow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ---- Responsive ---- */
@media (max-width: 1024px) {
  .feature-grid { grid-template-columns: repeat(2, 1fr); }
  .hero-section { flex-direction: column; align-items: flex-start; }
  .hero-desc { max-width: none; }
  .stats-terminal { width: 100%; }
  .quick-stats { flex-wrap: wrap; gap: 8px; }
}

@media (max-width: 640px) {
  .nexious-home { padding: 24px 18px; gap: 24px; }
  .title-line { font-size: 1.8rem; }
  .feature-grid { grid-template-columns: 1fr; }
  .hero-actions { flex-direction: column; }
}
</style>
