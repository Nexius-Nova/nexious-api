import api from './index';
import type { Token } from '../types';

export const tokensApi = {
  list: () => api.get<Token[]>('/tokens').then((r) => r.data),

  create: (data: Partial<Token>) =>
    api.post<Token>('/tokens', data).then((r) => r.data),

  update: (id: number, data: Partial<Token>) =>
    api.patch<Token>(`/tokens/${id}`, data).then((r) => r.data),

  remove: (id: number) =>
    api.delete<void>(`/tokens/${id}`).then((r) => r.data),
};
