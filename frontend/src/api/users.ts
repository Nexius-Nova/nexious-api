import api from './index';
import type { User, PaginatedResponse } from '../types';

export const usersApi = {
  me: () => api.get<User>('/users/me'),
  updateMe: (data: { username?: string; password?: string; currentPassword?: string }) => 
    api.patch<User>('/users/me', data),
  updateEmail: (data: { email: string; code: string }) => 
    api.patch<User>('/users/me/email', data),
  list: (params?: Record<string, unknown>) => 
    api.get<PaginatedResponse<User>>('/users', { params }),
  getById: (id: number) => api.get<User>(`/users/${id}`),
  create: (data: Record<string, unknown>) => api.post<User>('/users', data),
  update: (id: number, data: Record<string, unknown>) => api.patch<User>(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};
