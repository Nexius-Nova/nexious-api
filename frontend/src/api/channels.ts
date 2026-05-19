import api from './index';
import type { Channel, BalanceSnapshot } from '../types';

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

  // Balance
  getBalance: (id: number) =>
    api
      .get<{
        id: number;
        name: string;
        currency: string;
        lastBalance: number | null;
        lastBalanceAt: string | null;
        balanceEnabled: boolean;
      }>(`/channels/${id}/balance`)
      .then((r) => r.data),

  refreshBalance: (id: number) =>
    api
      .post<{ balance: number; currency: string; fetchedAt: string }>(
        `/channels/${id}/balance/refresh`,
      )
      .then((r) => r.data),

  getBalanceSnapshots: (id: number, limit?: number) =>
    api
      .get<BalanceSnapshot[]>(`/channels/${id}/balance/snapshots`, {
        params: { limit },
      })
      .then((r) => r.data),
};

