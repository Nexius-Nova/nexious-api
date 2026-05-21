import api from './index';
import type { Conversation, PaginatedResponse } from '../types';

export const conversationsApi = {
  list: (page = 1, limit = 20) =>
    api
      .get<PaginatedResponse<Conversation>>('/conversations', {
        params: { page, limit },
      })
      .then((r) => r.data),

  getOne: (id: number) =>
    api.get<Conversation>(`/conversations/${id}`).then((r) => r.data),

  create: (data: Partial<Conversation>) =>
    api.post<Conversation>('/conversations', data).then((r) => r.data),

  update: (id: number, data: Partial<Conversation>) =>
    api.put<Conversation>(`/conversations/${id}`, data).then((r) => r.data),

  remove: (id: number) =>
    api.delete<void>(`/conversations/${id}`).then((r) => r.data),
};
