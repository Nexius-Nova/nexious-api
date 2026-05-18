import api from './index';
import type { Channel } from '../types';

export const channelsApi = {
  list: () => api.get<Channel[]>('/channels').then((r) => r.data),

  create: (data: Partial<Channel>) =>
    api.post<Channel>('/channels', data).then((r) => r.data),

  update: (id: number, data: Partial<Channel>) =>
    api.patch<Channel>(`/channels/${id}`, data).then((r) => r.data),

  remove: (id: number) =>
    api.delete<void>(`/channels/${id}`).then((r) => r.data),

  test: (id: number) =>
    api
      .post<{ success: boolean; latency: number; error?: string }>(
        `/channels/${id}/test`,
      )
      .then((r) => r.data),
};
