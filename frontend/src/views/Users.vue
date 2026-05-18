<template>
  <div class="users animate-fade-in">
    <div class="view-header">
      <div class="header-text">
        <h2>用户管理</h2>
        <p>管理系统用户账号，分配管理员和普通用户角色。</p>
      </div>
      <button class="btn-primary" @click="openDialog()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        添加用户
      </button>
    </div>

    <DataTable :columns="columns" :data="users" empty-text="暂无用户数据">
      <template #cell-username="{ row }">
        <span class="username">{{ row.username }}</span>
      </template>
      <template #cell-email="{ row }">
        <span class="text-muted">{{ row.email }}</span>
      </template>
      <template #cell-role="{ row }">
        <span :class="['role-tag', row.role === 'super_admin' ? 'role-super' : row.role === 'admin' ? 'role-admin' : 'role-user']">
          {{ row.role === 'super_admin' ? '超级管理员' : row.role === 'admin' ? '管理员' : '用户' }}
        </span>
      </template>
      <template #cell-status="{ row }">
        <span :class="['status-dot', row.status ? 'status-active' : 'status-disabled']"></span>
        {{ row.status ? '正常' : '已禁用' }}
      </template>
      <template #cell-createdAt="{ row }">
        <span class="text-muted">{{ new Date(row.createdAt).toLocaleDateString() }}</span>
      </template>
      <template #cell-actions="{ row }">
        <div class="actions">
          <template v-if="canEdit(row as any)">
            <button class="icon-btn-sm" @click="openDialog(row as any)" title="编辑">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="icon-btn-sm" @click="toggleStatus(row as any)" :title="row.status ? '禁用' : '启用'">
              <svg v-if="row.status" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
            <button class="icon-btn-sm" @click="openResetPassword(row as any)" title="重置密码">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </button>
            <button class="icon-btn-sm danger" @click="deleteUser((row as any).id)" title="删除">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          </template>
          <span v-else class="text-muted" style="font-size:0.78rem">—</span>
        </div>
      </template>
    </DataTable>

    <!-- Add/Edit Dialog -->
    <Modal :visible="dialogVisible" :title="editingUser ? '编辑用户' : '添加用户'" width="440px" @close="dialogVisible = false">
      <FormInput v-model="form.username" label="用户名" placeholder="请输入用户名" />
      <FormInput v-model="form.email" label="邮箱" type="email" placeholder="请输入邮箱" />
      <FormInput v-if="!editingUser" v-model="form.password" label="密码" type="password" placeholder="至少 6 位字符" />
      <div class="form-group">
        <label class="form-label">角色</label>
        <SelectField v-model="form.role" :options="roleOptions" placeholder="请选择角色" />
      </div>
      <div v-if="dialogError" class="form-error-msg">{{ dialogError }}</div>
      <template #footer>
        <button class="btn-ghost" @click="dialogVisible = false">取消</button>
        <button class="btn-primary" @click="saveUser" :disabled="saving">
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </template>
    </Modal>

    <!-- Reset Password Dialog -->
    <Modal :visible="resetVisible" title="重置密码" width="380px" @close="resetVisible = false">
      <p style="margin-bottom: 12px; font-size: 0.85rem; color: var(--text-secondary);">
        为用户 <strong>{{ resetTarget?.username }}</strong> 设置新密码
      </p>
      <FormInput v-model="resetPasswordForm.password" label="新密码" type="password" placeholder="至少 6 位字符" />
      <div v-if="resetError" class="form-error-msg">{{ resetError }}</div>
      <template #footer>
        <button class="btn-ghost" @click="resetVisible = false">取消</button>
        <button class="btn-primary" @click="doResetPassword" :disabled="resetting">
          {{ resetting ? '重置中...' : '确认重置' }}
        </button>
      </template>
    </Modal>

    <!-- Delete Confirm -->
    <ConfirmDialog
      :visible="deleteVisible"
      title="删除用户"
      message="确定要删除此用户吗？此操作不可撤销。"
      @confirm="doDelete"
      @cancel="deleteVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import api from '../api';
import { useToast } from '../composables/useToast';
import { useAuthStore } from '../store/auth';
import DataTable from '../components/DataTable.vue';
import type { ColumnDef } from '../components/DataTable.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import SelectField from '../components/SelectField.vue';
import FormInput from '../components/FormInput.vue';
import Modal from '../components/Modal.vue';

const authStore = useAuthStore();

const roleOptions = [
  { value: 'user', label: '用户' },
  { value: 'admin', label: '管理员' },
];

const columns: ColumnDef[] = [
  { key: 'username', label: '用户名' },
  { key: 'email', label: '邮箱' },
  { key: 'role', label: '角色' },
  { key: 'status', label: '状态' },
  { key: 'createdAt', label: '创建时间' },
  { key: 'actions', label: '操作', align: 'right' },
];

function canEdit(user: UserItem): boolean {
  const me = authStore.user;
  if (!me) return false;
  // Cannot edit yourself
  if (me.id === user.id) return false;
  // Only super_admin can edit super_admin
  if (user.role === 'super_admin' && me.role !== 'super_admin') return false;
  // Regular admin cannot edit other admins (only super_admin can)
  if (me.role === 'admin' && user.role === 'admin') return false;
  return true;
}

const toast = useToast();

interface UserItem {
  id: number;
  username: string;
  email: string;
  role: string;
  status: boolean;
  createdAt: string;
}

const users = ref<UserItem[]>([]);

// Dialog state
const dialogVisible = ref(false);
const editingUser = ref<UserItem | null>(null);
const dialogError = ref('');
const saving = ref(false);

const form = reactive({
  username: '',
  email: '',
  password: '',
  role: 'user',
});

// Reset password state
const resetVisible = ref(false);
const resetTarget = ref<UserItem | null>(null);
const resetPasswordForm = reactive({ password: '' });
const resetError = ref('');
const resetting = ref(false);

// Delete state
const deleteVisible = ref(false);
const deleteTargetId = ref<number | null>(null);

async function fetchUsers() {
  try {
    const res = await api.get('/users');
    users.value = res.data;
  } catch {
    toast.error('获取用户列表失败');
  }
}

function openDialog(user?: UserItem) {
  dialogError.value = '';
  if (user) {
    editingUser.value = user;
    form.username = user.username;
    form.email = user.email;
    form.password = '';
    form.role = user.role;
  } else {
    editingUser.value = null;
    form.username = '';
    form.email = '';
    form.password = '';
    form.role = 'user';
  }
  dialogVisible.value = true;
}

async function saveUser() {
  dialogError.value = '';

  if (!form.username || !form.email) {
    dialogError.value = '请填写用户名和邮箱';
    return;
  }
  if (!editingUser.value && !form.password) {
    dialogError.value = '请填写密码';
    return;
  }
  if (!editingUser.value && form.password.length < 6) {
    dialogError.value = '密码长度不能少于 6 位';
    return;
  }

  saving.value = true;
  try {
    if (editingUser.value) {
      await api.patch(`/users/${editingUser.value.id}`, {
        username: form.username,
        email: form.email,
        role: form.role,
      });
      toast.success('用户信息已更新');
    } else {
      await api.post('/users', {
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      toast.success('用户创建成功');
    }
    dialogVisible.value = false;
    await fetchUsers();
  } catch (e: any) {
    dialogError.value = e.response?.data?.message || '操作失败';
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(user: UserItem) {
  try {
    await api.patch(`/users/${user.id}/status`);
    toast.success(user.status ? '用户已禁用' : '用户已启用');
    await fetchUsers();
  } catch {
    toast.error('操作失败');
  }
}

function openResetPassword(user: UserItem) {
  resetTarget.value = user;
  resetPasswordForm.password = '';
  resetError.value = '';
  resetVisible.value = true;
}

async function doResetPassword() {
  resetError.value = '';
  if (resetPasswordForm.password.length < 6) {
    resetError.value = '密码长度不能少于 6 位';
    return;
  }

  resetting.value = true;
  try {
    await api.patch(`/users/${resetTarget.value!.id}/reset-password`, {
      password: resetPasswordForm.password,
    });
    toast.success('密码已重置');
    resetVisible.value = false;
  } catch (e: any) {
    resetError.value = e.response?.data?.message || '重置失败';
  } finally {
    resetting.value = false;
  }
}

function deleteUser(id: number) {
  deleteTargetId.value = id;
  deleteVisible.value = true;
}

async function doDelete() {
  if (deleteTargetId.value == null) return;
  try {
    await api.delete(`/users/${deleteTargetId.value}`);
    toast.success('用户已删除');
    deleteVisible.value = false;
    await fetchUsers();
  } catch {
    toast.error('删除失败');
  }
}

onMounted(fetchUsers);
</script>

<style scoped>
.users {
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

.btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 9px 18px;
  background: var(--accent-blue);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-primary:hover {
  filter: brightness(1.1);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Table */
.table-card {
  overflow: hidden;
}

.table-container {
  overflow-x: auto;
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.custom-table th {
  padding: 12px 16px;
  font-size: 0.73rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 1px solid var(--border-subtle);
  text-align: left;
  background: var(--bg-sidebar);
}

.custom-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}

.custom-table tbody tr:last-child td {
  border-bottom: none;
}

.empty-row {
  text-align: center !important;
  padding: 40px 16px !important;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.username {
  font-weight: 500;
  color: var(--text-primary);
}

.text-muted {
  color: var(--text-muted);
  font-size: 0.83rem;
}

/* Role tag */
.role-tag {
  display: inline-block;
  font-size: 0.73rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 6px;
}

.role-admin {
  color: var(--accent-blue);
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.role-user {
  color: var(--text-muted);
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
}

.role-super {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

/* Status dot */
.status-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 6px;
}

.status-active {
  background: var(--accent-green);
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.4);
}

.status-disabled {
  background: var(--accent-red);
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.4);
}

/* Actions */
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.icon-btn-sm {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.icon-btn-sm:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
  border-color: var(--border-subtle);
}

.icon-btn-sm.danger:hover {
  background: rgba(239, 68, 68, 0.08);
  color: var(--accent-red);
  border-color: rgba(239, 68, 68, 0.2);
}

.animate-fade-in {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
