<template>
  <div class="profile animate-fade-in">
    <div class="view-header">
      <div class="header-text">
        <h2>个人信息</h2>
        <p>管理你的账号信息与密码。</p>
      </div>
    </div>

    <div class="profile-layout">
      <section class="profile-card profile-card-main glass-panel">
        <div class="card-header">
          <div>
            <h3>基本信息</h3>
            <p>更新账号展示信息与绑定邮箱。</p>
          </div>
        </div>
        <div class="card-body">
          <div class="profile-form">
            <FormInput v-model="form.username" label="用户名" placeholder="请输入用户名" />

            <div class="form-group">
              <label class="form-label">邮箱</label>
              <template v-if="!editingEmail">
                <div class="email-display">
                  <span class="email-value">{{ profile?.email }}</span>
                  <button type="button" class="btn-link" @click="editingEmail = true">修改</button>
                </div>
              </template>
              <template v-else>
                <div class="email-edit-group">
                  <div class="email-edit-row">
                    <input
                      v-model="emailForm.newEmail"
                      type="email"
                      class="form-input"
                      placeholder="请输入新邮箱"
                    />
                    <button
                      type="button"
                      class="btn-send-code"
                      :disabled="emailSending || countdown > 0"
                      @click="sendEmailCode"
                    >
                      {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
                    </button>
                  </div>
                  <div class="email-edit-row email-code-row">
                    <input
                      v-model="emailForm.code"
                      class="form-input code-input"
                      placeholder="请输入验证码"
                      maxlength="6"
                    />
                    <div class="inline-actions">
                      <button
                        type="button"
                        class="btn-save"
                        :disabled="emailSaving"
                        @click="confirmChangeEmail"
                      >
                        {{ emailSaving ? '验证中...' : '确认修改' }}
                      </button>
                      <button type="button" class="btn-cancel" @click="cancelEmailEdit">取消</button>
                    </div>
                  </div>
                  <div v-if="emailError" class="form-error-msg">{{ emailError }}</div>
                </div>
              </template>
            </div>

            <div class="profile-meta-grid">
              <div class="form-group">
                <label class="form-label">角色</label>
                <div class="role-display">
                  <span :class="['role-tag', roleClass]">{{ roleLabel }}</span>
                  <span class="role-hint">角色不可自行修改</span>
                </div>
              </div>
              <FormInput :model-value="formatDate(profile?.createdAt)" label="注册时间" disabled />
            </div>

            <div v-if="profileError" class="form-error-msg">{{ profileError }}</div>
          </div>

          <div class="card-actions">
            <button class="btn-primary" @click="saveProfile" :disabled="saving">
              {{ saving ? '保存中...' : '保存修改' }}
            </button>
          </div>
        </div>
      </section>

      <section class="profile-card profile-card-side glass-panel">
        <div class="card-header">
          <div>
            <h3>修改密码</h3>
            <p>设置新的登录密码。</p>
          </div>
        </div>
        <div class="card-body">
          <div class="profile-form">
            <FormInput v-model="passwordForm.password" label="新密码" type="password" placeholder="至少 6 位字符" />
            <FormInput v-model="passwordForm.confirm" label="确认新密码" type="password" placeholder="再次输入新密码" />
            <div v-if="passwordError" class="form-error-msg">{{ passwordError }}</div>
          </div>

          <div class="card-actions">
            <button class="btn-primary" @click="changePassword" :disabled="changingPwd">
              {{ changingPwd ? '修改中...' : '修改密码' }}
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import api from '../api';
import { useAuthStore } from '../store/auth';
import { useToast } from '../composables/useToast';
import FormInput from '../components/FormInput.vue';

const authStore = useAuthStore();
const toast = useToast();

interface Profile {
  id: number;
  username: string;
  email: string;
  role: string;
  status: boolean;
  createdAt: string;
}

const profile = ref<Profile | null>(null);
const profileError = ref('');
const saving = ref(false);
const form = reactive({ username: '' });

// --- Email change state ---
const editingEmail = ref(false);
const emailForm = reactive({ newEmail: '', code: '' });
const emailError = ref('');
const emailSending = ref(false);
const emailSaving = ref(false);
const countdown = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

const passwordForm = reactive({ password: '', confirm: '' });
const passwordError = ref('');
const changingPwd = ref(false);

const roleLabel = computed(() => {
  const map: Record<string, string> = { super_admin: '超级管理员', admin: '管理员', user: '用户' };
  return map[profile.value?.role || ''] || profile.value?.role || '';
});

const roleClass = computed(() => {
  const map: Record<string, string> = { super_admin: 'role-super', admin: 'role-admin', user: 'role-user' };
  return map[profile.value?.role || ''] || '';
});

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString();
}

async function fetchProfile() {
  try {
    const res = await api.get('/users/me');
    profile.value = res.data;
    form.username = res.data.username;
  } catch {
    toast.error('获取个人信息失败');
  }
}

async function saveProfile() {
  profileError.value = '';
  if (!form.username.trim()) {
    profileError.value = '用户名不能为空';
    return;
  }
  saving.value = true;
  try {
    const res = await api.patch('/users/me', { username: form.username });
    profile.value = res.data;
    authStore.user = { id: res.data.id, username: res.data.username, email: res.data.email, role: res.data.role };
    toast.success('信息已更新');
  } catch (e: any) {
    profileError.value = e.response?.data?.message || '更新失败';
  } finally {
    saving.value = false;
  }
}

async function changePassword() {
  passwordError.value = '';
  if (!passwordForm.password || passwordForm.password.length < 6) {
    passwordError.value = '密码长度不能少于 6 位';
    return;
  }
  if (passwordForm.password !== passwordForm.confirm) {
    passwordError.value = '两次输入的密码不一致';
    return;
  }
  changingPwd.value = true;
  try {
    await api.patch('/users/me', { password: passwordForm.password });
    toast.success('密码已修改');
    passwordForm.password = '';
    passwordForm.confirm = '';
  } catch (e: any) {
    passwordError.value = e.response?.data?.message || '修改密码失败';
  } finally {
    changingPwd.value = false;
  }
}

// --- Email change ---
function startCountdown() {
  countdown.value = 60;
  countdownTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(countdownTimer!);
      countdownTimer = null;
    }
  }, 1000);
}

async function sendEmailCode() {
  emailError.value = '';
  if (!emailForm.newEmail || !emailForm.newEmail.includes('@')) {
    emailError.value = '请输入有效的新邮箱';
    return;
  }
  if (emailForm.newEmail === profile.value?.email) {
    emailError.value = '新邮箱不能与当前邮箱相同';
    return;
  }
  emailSending.value = true;
  try {
    await api.post('/auth/send-verify-code', { email: emailForm.newEmail, purpose: 'change-email' });
    toast.success('验证码已发送');
    startCountdown();
  } catch (e: any) {
    const msg = e.response?.data?.message || '发送失败';
    emailError.value = msg;
    toast.error(msg);
  } finally {
    emailSending.value = false;
  }
}

async function confirmChangeEmail() {
  emailError.value = '';
  if (!emailForm.code || emailForm.code.length !== 6) {
    emailError.value = '请输入 6 位验证码';
    return;
  }
  emailSaving.value = true;
  try {
    const res = await api.patch('/users/me/email', {
      email: emailForm.newEmail,
      code: emailForm.code,
    });
    profile.value = res.data;
    authStore.user = { id: res.data.id, username: res.data.username, email: res.data.email, role: res.data.role };
    toast.success('邮箱已更新');
    cancelEmailEdit();
  } catch (e: any) {
    emailError.value = e.response?.data?.message || '修改邮箱失败';
  } finally {
    emailSaving.value = false;
  }
}

function cancelEmailEdit() {
  editingEmail.value = false;
  emailForm.newEmail = '';
  emailForm.code = '';
  emailError.value = '';
  emailSending.value = false;
  emailSaving.value = false;
  countdown.value = 0;
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

onMounted(fetchProfile);
</script>

<style scoped>
.profile {
  padding: 0;
  max-width: 100%;
}

.view-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
}

.header-text h2 {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-primary);
}

.header-text p {
  font-size: 0.83rem;
  color: var(--text-muted);
}

.profile-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.8fr);
  align-items: start;
  gap: 18px;
}

.profile-card {
  padding: 0;
  overflow: hidden;
}

.card-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.card-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0;
}

.card-header p {
  margin-top: 5px;
  color: var(--text-muted);
  font-size: 0.78rem;
  line-height: 1.45;
}

.card-body {
  padding: 22px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.profile-form {
  display: grid;
  gap: 16px;
}

.card-body :deep(.form-group) {
  margin-bottom: 0;
}

.card-body .form-group {
  margin-bottom: 0;
}

.profile-meta-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(180px, 0.72fr);
  gap: 14px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 9px 16px;
  background: var(--accent-blue);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-primary:hover {
  filter: brightness(1.1);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 2px;
}

.role-display {
  display: flex;
  align-items: center;
  min-height: 41px;
  gap: 12px;
  padding: 10px 12px;
  background-color: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.role-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.role-tag::before {
  content: "";
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.role-super {
  color: #f59e0b;
  background-color: rgba(245, 158, 11, 0.1);
}
.role-super::before {
  background: #f59e0b;
  box-shadow: 0 0 6px #f59e0b;
}

.role-admin {
  color: var(--accent-blue);
  background-color: rgba(var(--accent-blue-rgb), 0.08);
}
.role-admin::before {
  background: var(--accent-blue);
  box-shadow: 0 0 6px var(--accent-blue);
}

.role-user {
  color: var(--text-muted);
  background-color: var(--bg-card-hover);
}
.role-user::before {
  background: var(--text-muted);
}

.role-hint {
  font-size: 0.78rem;
  color: var(--text-muted);
  min-width: 0;
}

.form-error-msg {
  font-size: 0.8rem;
  color: var(--accent-red);
  margin-top: 4px;
  margin-bottom: 4px;
}

/* --- Email edit --- */
.email-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 41px;
  padding: 10px 12px;
  background-color: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.email-value {
  min-width: 0;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 0.85rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-link {
  background-color: transparent;
  border: none;
  color: var(--accent-blue);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  padding: 2px 0;
  flex-shrink: 0;
}

.btn-link:hover {
  color: var(--text-primary);
}

.email-edit-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.email-edit-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.email-code-row {
  align-items: stretch;
}

.form-input {
  flex: 1;
  min-width: 0;
  min-height: 41px;
  padding: 9px 12px;
  background-color: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.85rem;
  outline: none;
  transition: border 0.15s;
}

.form-input:focus {
  border-color: var(--accent-blue);
}

.code-input {
  max-width: 170px;
}

.inline-actions {
  display: flex;
  gap: 8px;
}

.btn-send-code {
  flex-shrink: 0;
  min-height: 41px;
  padding: 9px 13px;
  background-color: var(--bg-card-hover);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--accent-blue);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.btn-send-code:hover:not(:disabled) {
  background-color: rgba(var(--accent-blue-rgb), 0.1);
}

.btn-send-code:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-save {
  flex-shrink: 0;
  min-height: 41px;
  padding: 9px 14px;
  background-color: var(--accent-blue);
  border: none;
  border-radius: var(--radius-md);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.btn-save:hover:not(:disabled) {
  filter: brightness(1.1);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  flex-shrink: 0;
  min-height: 41px;
  padding: 9px 14px;
  background-color: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-size: 0.78rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.btn-cancel:hover {
  background-color: var(--bg-card-hover);
  color: var(--text-primary);
}

@media (max-width: 980px) {
  .profile-layout {
    grid-template-columns: 1fr;
  }

  .profile-card-side {
    max-width: none;
  }
}

@media (max-width: 640px) {
  .view-header {
    margin-bottom: 18px;
  }

  .card-header {
    padding: 18px 18px 14px;
  }

  .card-body {
    padding: 18px;
  }

  .profile-meta-grid,
  .email-edit-row,
  .email-code-row {
    grid-template-columns: 1fr;
    display: grid;
  }

  .code-input {
    max-width: none;
  }

  .inline-actions,
  .card-actions {
    justify-content: stretch;
  }

  .inline-actions > button,
  .card-actions > button,
  .btn-send-code {
    width: 100%;
  }

  .role-display {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
}
</style>
