import api from './index';

export const conversationsApi = {
  list: (page = 1, limit = 20) =>
    api
      .get<{ items: any[]; total: number }>('/conversations', {
        params: { page, limit },
      })
      .then((r) => r.data),

  getOne: (id: number) =>
    api.get<any>(`/conversations/${id}`).then((r) => r.data),

  create: (data: Record<string, unknown>) =>
    api.post<any>('/conversations', data).then((r) => r.data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<any>(`/conversations/${id}`, data).then((r) => r.data),

  remove: (id: number) =>
    api.delete<void>(`/conversations/${id}`).then((r) => r.data),
};
