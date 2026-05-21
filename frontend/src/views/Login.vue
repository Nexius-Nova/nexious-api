<template>
  <main class="auth-page">
    <section class="auth-shell" aria-label="Nexious API 账号入口">
      <aside class="info-panel">
        <router-link to="/" class="brand-link" aria-label="返回首页">
          <img src="../assets/icon.png" alt="Nexious" width="32" height="32" />
          <span>Nexious API</span>
        </router-link>

        <div class="intro-block">
          <span class="eyebrow">
            <span class="status-dot status-active"></span>
            控制台已就绪
          </span>
          <h1>统一管理模型网关、令牌和调用观测。</h1>
          <p>面向 API 网关的轻量控制中心，集中处理渠道接入、访问凭证和日志分析。</p>
        </div>

        <div class="signal-grid" aria-label="平台能力">
          <div v-for="item in signalItems" :key="item.label" class="signal-item">
            <component :is="item.icon" class="signal-icon" />
            <strong>{{ item.value }}</strong>
            <span>{{ item.label }}</span>
          </div>
        </div>

        <div class="status-panel" aria-label="网关状态">
          <div class="status-panel-head">
            <span class="terminal-dot"></span>
            <span>gateway/status</span>
          </div>
          <div class="status-lines">
            <p><span>auth</span> password access</p>
            <p><span>route</span> /console</p>
            <p><span>scope</span> tokens / channels / logs</p>
          </div>
        </div>
      </aside>

      <section class="form-panel" aria-labelledby="auth-title">
        <div class="mobile-brand">
          <router-link to="/" class="brand-link" aria-label="返回首页">
            <img src="../assets/icon.png" alt="Nexious" width="30" height="30" />
            <span>Nexious API</span>
          </router-link>
        </div>

        <div class="form-inner">
          <div class="auth-heading">
            <span class="section-kicker">{{ currentMeta.kicker }}</span>
            <h2 id="auth-title">{{ currentMeta.title }}</h2>
            <p>{{ currentMeta.subtitle }}</p>
          </div>

          <form class="auth-form" @submit.prevent="onSubmit">
            <!-- Forgot password mode -->
            <template v-if="forgotMode">
              <div class="email-row">
                <div class="email-input-wrap">
                  <FormInput
                    v-model="form.email"
                    label="注册邮箱"
                    type="email"
                    placeholder="请输入注册时使用的邮箱"
                    autocomplete="email"
                    required
                  />
                </div>
                <button
                  type="button"
                  class="btn-send-code"
                  :disabled="sendingCode || codeCountdown > 0 || !form.email"
                  @click="sendCode"
                >
                  {{ codeCountdown > 0 ? `${codeCountdown}s` : '发送验证码' }}
                </button>
              </div>

              <FormInput
                v-model="form.verifyCode"
                label="验证码"
                placeholder="请输入 6 位验证码"
                autocomplete="one-time-code"
                required
              />

              <FormInput
                v-model="form.password"
                label="新密码"
                type="password"
                placeholder="至少 6 位字符"
                autocomplete="new-password"
                required
              />
              <FormInput
                v-model="form.confirmPassword"
                label="确认新密码"
                type="password"
                placeholder="请再次输入新密码"
                autocomplete="new-password"
                required
              />
            </template>

            <!-- Login / Register mode -->
            <template v-else>
              <FormInput
                v-model="form.username"
                label="用户名"
                placeholder="请输入用户名"
                autocomplete="username"
                required
              />

              <!-- Register: email + send code button -->
              <div v-if="mode === 'register'" class="email-row">
                <div class="email-input-wrap">
                  <FormInput
                    v-model="form.email"
                    label="邮箱"
                    type="email"
                    placeholder="请输入邮箱"
                    autocomplete="email"
                    required
                  />
                </div>
                <button
                  type="button"
                  class="btn-send-code"
                  :disabled="sendingCode || codeCountdown > 0 || !form.email"
                  @click="sendCode"
                >
                  {{ codeCountdown > 0 ? `${codeCountdown}s` : '发送验证码' }}
                </button>
              </div>

              <FormInput
                v-if="mode === 'register'"
                v-model="form.verifyCode"
                label="验证码"
                placeholder="请输入 6 位验证码"
                autocomplete="one-time-code"
                required
              />

              <div class="password-wrap">
                <FormInput
                  v-model="form.password"
                  label="密码"
                  :type="passwordVisible ? 'text' : 'password'"
                  :placeholder="mode === 'login' ? '请输入密码' : '至少 6 位字符'"
                  :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
                  required
                />
                <button type="button" class="password-toggle" @click="passwordVisible = !passwordVisible" :aria-label="passwordVisible ? '隐藏密码' : '显示密码'" tabindex="-1">
                  <svg v-if="passwordVisible" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                  <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </div>
              <!-- Password strength indicator (register only) -->
              <div v-if="mode === 'register' && form.password" class="password-strength">
                <div class="strength-bar-bg">
                  <div class="strength-bar-fill" :style="{ width: (passwordStrength.score / 5) * 100 + '%', background: passwordStrength.color }"></div>
                </div>
                <span class="strength-label" :style="{ color: passwordStrength.color }">{{ passwordStrength.label }}</span>
              </div>
              <div v-if="mode === 'register'" class="password-wrap">
                <FormInput
                  v-model="form.confirmPassword"
                  label="确认密码"
                  :type="passwordVisible ? 'text' : 'password'"
                  placeholder="请再次输入密码"
                  autocomplete="new-password"
                  required
                />
              </div>
            </template>

            <!-- Login: forgot password link -->
            <div v-if="mode === 'login'" class="forgot-row">
              <button type="button" class="text-action" @click="enterForgotMode">忘记密码？</button>
            </div>

            <div v-if="mode === 'login'" style="display:none">
              <SlideCaptcha
                ref="captchaRef"
                :disabled="loading"
                @verified="onCaptchaVerified"
              />
            </div>

            <div v-if="error" class="auth-msg auth-error" role="alert">{{ error }}</div>
            <div v-if="success" class="auth-msg auth-success" role="status">{{ success }}</div>

            <button type="submit" class="btn-primary btn-full" :disabled="loading || submitDisabled">
              <span v-if="loading" class="btn-spinner"></span>
              <span>{{ submitText }}</span>
            </button>
          </form>

          <div class="auth-footnote">
            <template v-if="forgotMode">
              <span>想起密码了？</span>
              <button type="button" class="text-action" @click="exitForgotMode">返回登录</button>
            </template>
            <template v-else>
              <span>{{ mode === 'login' ? '没有账号？' : '已有账号？' }}</span>
              <button
                type="button"
                class="text-action"
                @click="switchMode(mode === 'login' ? 'register' : 'login')"
              >
                {{ mode === 'login' ? '创建新账号' : '返回登录' }}
              </button>
            </template>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, h, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import { authApi } from '../api/auth';
import { useToast } from '../composables/useToast';
import FormInput from '../components/FormInput.vue';
import SlideCaptcha from '../components/SlideCaptcha.vue';

type AuthMode = 'login' | 'register';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const mode = ref<AuthMode>('login');
const forgotMode = ref(false);
const loading = ref(false);
const error = ref('');
const success = ref('');
const passwordVisible = ref(false);

// Password strength
const passwordStrength = computed(() => {
  const pwd = form.password;
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score, label: '弱', color: '#ef4444' };
  if (score <= 2) return { score, label: '弱', color: '#f59e0b' };
  if (score <= 3) return { score, label: '中', color: '#f59e0b' };
  if (score === 4) return { score, label: '强', color: '#10b981' };
  return { score, label: '强', color: '#10b981' };
});

// Captcha (login only)
const captchaRef = ref<InstanceType<typeof SlideCaptcha> | null>(null);
const captchaToken = ref('');

// Email verification (register only)
const sendingCode = ref(false);
const codeCountdown = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  verifyCode: '',
});

const signalItems = [
  {
    label: '模型渠道',
    value: 'Multi',
    icon: () => h('svg', iconProps(), [
      h('path', { d: 'M18 8a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8Z' }),
      h('path', { d: 'M10 12h.01' }),
      h('path', { d: 'M14 12h.01' }),
      h('path', { d: 'M18 12h4' }),
    ]),
  },
  {
    label: '访问令牌',
    value: 'Token',
    icon: () => h('svg', iconProps(), [
      h('path', { d: 'M21 2l-2 2' }),
      h('circle', { cx: 7, cy: 10, r: 5 }),
      h('path', { d: 'M11 5.5l9 9' }),
      h('path', { d: 'M15.5 10l4.5 4.5V22l-2-2-2 2-2-2-2 2v-4.5l-4.5-4.5' }),
    ]),
  },
  {
    label: '调用日志',
    value: 'Logs',
    icon: () => h('svg', iconProps(), [
      h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
      h('polyline', { points: '14 2 14 8 20 8' }),
      h('line', { x1: 16, y1: 13, x2: 8, y2: 13 }),
      h('line', { x1: 16, y1: 17, x2: 8, y2: 17 }),
    ]),
  },
];

const currentMeta = computed(() => {
  if (forgotMode.value) {
    return {
      kicker: '找回密码',
      title: '重置你的密码',
      subtitle: '输入注册邮箱，我们将发送验证码以验证你的身份。',
    };
  }
  if (mode.value === 'login') {
    return {
      kicker: '安全登录',
      title: '欢迎回来',
      subtitle: '登录控制台，继续管理你的 API 渠道、密钥与调用数据。',
    };
  }

  return {
    kicker: '创建账号',
    title: '接入 Nexious API',
    subtitle: '注册后即可进入控制台，开始配置统一的模型网关能力。',
  };
});

const submitText = computed(() => {
  if (loading.value) return forgotMode.value ? '重置中...' : mode.value === 'login' ? '验证中...' : '注册中...';
  if (forgotMode.value) return '重置密码';
  return mode.value === 'login' ? '登录控制台' : '创建账号';
});

const submitDisabled = computed(() => {
  if (forgotMode.value) return !form.verifyCode;
  if (mode.value === 'login') return false; // Captcha opens as popup on click
  return !form.verifyCode;
});

function iconProps() {
  return {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 2,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  };
}

function resetFeedback() {
  error.value = '';
  success.value = '';
}

function switchMode(nextMode: AuthMode) {
  mode.value = nextMode;
  resetFeedback();
  form.password = '';
  form.confirmPassword = '';
  form.verifyCode = '';
  captchaToken.value = '';
  captchaRef.value?.reset();
  // Clear countdown
  codeCountdown.value = 0;
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
}

async function sendCode() {
  if (sendingCode.value || codeCountdown.value > 0 || !form.email) return;
  resetFeedback();
  sendingCode.value = true;

  const purpose = forgotMode.value ? 'reset' : 'register';

  try {
    await authApi.sendVerifyCode(form.email, purpose);
    toast.success('验证码已发送，请查收邮件');
    // Start 60s countdown
    codeCountdown.value = 60;
    countdownTimer = setInterval(() => {
      codeCountdown.value--;
      if (codeCountdown.value <= 0) {
        if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
      }
    }, 1000);
  } catch (e: any) {
    const msg = e.response?.data?.error?.message || e.response?.data?.message || '发送失败，请稍后再试';
    error.value = msg;
    toast.error(msg);
  } finally {
    sendingCode.value = false;
  }
}

async function handleLogin() {
  resetFeedback();

  // Open captcha popup instead of inline check
  captchaToken.value = '';
  captchaRef.value?.open();
}

async function onCaptchaVerified(token: string) {
  captchaToken.value = token;
  loading.value = true;

  try {
    await authStore.login(form.username, form.password);
    toast.success('登录成功');
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/console';
    setTimeout(() => router.push(redirect), 300);
  } catch (e: any) {
    captchaToken.value = '';
    captchaRef.value?.reset();
    const msg = e.response?.data?.error?.message || e.response?.data?.message || '登录失败，请检查用户名和密码';
    error.value = msg;
    toast.error(msg);
  } finally {
    loading.value = false;
  }
}

async function handleRegister() {
  resetFeedback();

  if (!form.verifyCode) {
    error.value = '请输入邮箱验证码';
    return;
  }

  if (form.verifyCode.length !== 6) {
    error.value = '请输入 6 位验证码';
    return;
  }

  if (form.password.length < 6) {
    error.value = '密码长度不能少于 6 位';
    return;
  }

  if (form.password !== form.confirmPassword) {
    error.value = '两次输入的密码不一致';
    return;
  }

  loading.value = true;

  try {
    await authStore.register(form.username, form.email, form.password, form.verifyCode);
    // Clear countdown on success
    codeCountdown.value = 0;
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    // Auto-login after successful registration
    await authStore.login(form.username, form.password);
    toast.success('注册成功，已自动登录');
    setTimeout(() => router.push('/console'), 300);
  } catch (e: any) {
    const msg = e.response?.data?.error?.message || e.response?.data?.message || '注册失败，请稍后再试';
    error.value = msg;
    toast.error(msg);
  } finally {
    loading.value = false;
  }
}

// --- Forgot password ---
function enterForgotMode() {
  resetFeedback();
  forgotMode.value = true;
  // Keep username and email, clear password/code fields
  form.password = '';
  form.confirmPassword = '';
  form.verifyCode = '';
  codeCountdown.value = 0;
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
}

function exitForgotMode() {
  forgotMode.value = false;
  resetFeedback();
  form.password = '';
  form.confirmPassword = '';
  form.verifyCode = '';
  codeCountdown.value = 0;
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
}

function onSubmit() {
  if (forgotMode.value) handleForgotPassword();
  else if (mode.value === 'login') handleLogin();
  else handleRegister();
}

async function handleForgotPassword() {
  resetFeedback();

  if (!form.verifyCode || form.verifyCode.length !== 6) {
    error.value = '请输入 6 位验证码';
    return;
  }

  if (form.password.length < 6) {
    error.value = '密码长度不能少于 6 位';
    return;
  }

  if (form.password !== form.confirmPassword) {
    error.value = '两次输入的密码不一致';
    return;
  }

  loading.value = true;

  try {
    await authApi.resetPassword(form.email, form.verifyCode, form.password);
    toast.success('密码重置成功，请使用新密码登录');
    codeCountdown.value = 0;
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    exitForgotMode();
  } catch (e: any) {
    const msg = e.response?.data?.error?.message || e.response?.data?.message || '密码重置失败';
    error.value = msg;
    toast.error(msg);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
  background-color: var(--bg-app, #050505);
}

.auth-shell {
  width: min(1040px, 100%);
  max-height: calc(100vh - 56px);
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(380px, 0.95fr);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-lg, 12px);
  background-color: var(--bg-card, #121212);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
  overflow: hidden;
  animation: pageIn 0.42s ease-out both;
}

.info-panel,
.form-panel {
  min-width: 0;
  min-height: 0;
}

.info-panel {
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  gap: 20px;
  padding: 34px;
  background-color: var(--bg-sidebar, #0a0a0a);
  border-right: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  overflow-y: auto;
}

.brand-link {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--text-primary, #ffffff);
  font-size: 0.98rem;
  font-weight: 700;
}

.brand-link img {
  border-radius: 8px;
}

.intro-block {
  align-self: center;
  max-width: 500px;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--accent-green, #10b981);
  font-size: 0.78rem;
  font-weight: 600;
  margin-bottom: 14px;
}

.intro-block h1 {
  max-width: 520px;
  color: var(--text-primary, #ffffff);
  font-size: clamp(1.8rem, 3.5vw, 2.65rem);
  line-height: 1.12;
}

.intro-block p {
  max-width: 430px;
  margin-top: 12px;
  color: var(--text-secondary, #a1a1aa);
  font-size: 0.875rem;
  line-height: 1.7;
}

.signal-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.signal-item {
  padding: 14px;
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-md, 8px);
  background-color: rgba(255, 255, 255, 0.02);
}

[data-theme='light'] .signal-item {
  background-color: rgba(15, 23, 42, 0.02);
}

.signal-icon {
  color: var(--accent-blue, #3b82f6);
  margin-bottom: 12px;
}

.signal-item strong,
.signal-item span {
  display: block;
}

.signal-item strong {
  color: var(--text-primary, #ffffff);
  font-size: 0.92rem;
  font-family: var(--font-mono, monospace);
}

.signal-item span {
  margin-top: 4px;
  color: var(--text-muted, #71717a);
  font-size: 0.72rem;
}

.status-panel {
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-md, 8px);
  background-color: var(--bg-card, #121212);
  overflow: hidden;
}

.status-panel-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  color: var(--text-muted, #71717a);
  font-family: var(--font-mono, monospace);
  font-size: 0.72rem;
}

.terminal-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--accent-green, #10b981);
  box-shadow: 0 0 8px var(--accent-green, #10b981);
}

.status-lines {
  padding: 12px 14px;
  display: grid;
  gap: 8px;
  color: var(--text-secondary, #a1a1aa);
  font-family: var(--font-mono, monospace);
  font-size: 0.74rem;
}

.status-lines span {
  display: inline-block;
  width: 52px;
  color: var(--accent-blue, #3b82f6);
}

.form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 34px;
  overflow-y: auto;
}

.form-inner {
  width: 100%;
  max-width: 360px;
}

.mobile-brand {
  display: none;
  margin-bottom: 22px;
}

.auth-heading {
  margin-bottom: 24px;
}

.section-kicker {
  display: block;
  margin-bottom: 8px;
  color: var(--accent-blue, #3b82f6);
  font-size: 0.74rem;
  font-weight: 700;
}

.auth-heading h2 {
  color: var(--text-primary, #ffffff);
  font-size: 1.7rem;
  line-height: 1.2;
}

.auth-heading p {
  margin-top: 8px;
  color: var(--text-muted, #71717a);
  font-size: 0.88rem;
  line-height: 1.65;
}

/* ── 邮箱验证码行 ── */
.email-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.email-input-wrap {
  flex: 1;
  min-width: 0;
}

.email-input-wrap :deep(.form-group) {
  margin-bottom: 0;
}

/* ── 密码可见性切换 ── */
.password-wrap {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 10px;
  top: 34px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-muted, #71717a);
  cursor: pointer;
  border-radius: 4px;
  transition: color 0.15s;
}

.password-toggle:hover {
  color: var(--text-secondary, #a1a1aa);
}

/* ── 密码强度指示器 ── */
.password-strength {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: -10px;
  margin-bottom: 16px;
}

.strength-bar-bg {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

[data-theme='light'] .strength-bar-bg {
  background: rgba(15, 23, 42, 0.08);
}

.strength-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease, background 0.3s ease;
}

.strength-label {
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.btn-send-code {
  flex-shrink: 0;
  height: 42px;
  padding: 0 14px;
  margin-bottom: 16px;
  border: 1px solid var(--accent-blue, #3b82f6);
  border-radius: var(--radius-md, 8px);
  background: transparent;
  color: var(--accent-blue, #3b82f6);
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.btn-send-code:hover:not(:disabled) {
  background: var(--accent-blue, #3b82f6);
  color: #ffffff;
}

.btn-send-code:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.forgot-row {
  display: flex;
  justify-content: flex-end;
  margin-top: -8px;
  margin-bottom: 4px;
}

.auth-form :deep(.form-group) {
  margin-bottom: 16px;
}

.auth-form :deep(.form-input) {
  min-height: 42px;
}

.btn-full {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 44px;
  margin-top: 8px;
  background-color: var(--accent-blue, #3b82f6);
  color: #ffffff;
  font-size: 0.92rem;
  font-weight: 700;
}

.btn-full:disabled {
  opacity: 0.62;
  cursor: not-allowed;
  transform: none;
}

.btn-spinner {
  width: 17px;
  height: 17px;
  border: 2px solid rgba(255, 255, 255, 0.32);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

.auth-msg {
  margin-bottom: 14px;
  padding: 10px 12px;
  border-radius: var(--radius-md, 8px);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  font-size: 0.82rem;
  line-height: 1.5;
}

.auth-error {
  color: var(--accent-red, #ef4444);
  background-color: rgba(239, 68, 68, 0.06);
  border-color: rgba(239, 68, 68, 0.18);
}

.auth-success {
  color: var(--accent-green, #10b981);
  background-color: rgba(16, 185, 129, 0.06);
  border-color: rgba(16, 185, 129, 0.18);
}

.auth-footnote {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 22px;
  color: var(--text-muted, #71717a);
  font-size: 0.84rem;
}

.text-action {
  color: var(--accent-blue, #3b82f6);
  font-size: 0.84rem;
  font-weight: 700;
}

.text-action:hover {
  color: var(--text-primary, #ffffff);
}

@keyframes pageIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 920px) {
  .auth-page {
    align-items: flex-start;
    padding: 22px;
    overflow-y: auto;
  }

  .auth-shell {
    display: block;
    max-height: none;
    max-width: 460px;
  }

  .info-panel {
    display: none;
  }

  .form-panel {
    padding: 28px;
    overflow-y: visible;
  }

  .mobile-brand {
    display: block;
  }
}

@media (max-width: 520px) {
  .auth-page {
    padding: 14px;
  }

  .form-panel {
    padding: 22px 20px 24px;
  }

  .auth-heading h2 {
    font-size: 1.45rem;
  }

  .auth-footnote {
    flex-direction: column;
    gap: 6px;
  }
}
</style>
