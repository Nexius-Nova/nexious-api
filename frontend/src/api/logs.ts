import api from './index';
import type { Log } from '../types';

export const logsApi = {
  list: (params?: Record<string, string | number>) =>
    api
      .get<{ items: Log[]; total: number; page: number; limit: number }>(
        '/logs',
        { params },
      )
      .then((r) => r.data),

  stats: () =>
    api
      .get<{
        totalTokens: number;
        todayTokens: number;
        totalRequests: number;
        todayRequests: number;
        avgTokensPerRequest: number;
      }>('/logs/stats')
      .then((r) => r.data),

  dailyUsage: (days: number) =>
    api
      .get<{ date: string; totalTokens: number; requestCount: number }[]>(
        '/logs/daily',
        { params: { days } },
      )
      .then((r) => r.data),

  modelDistribution: () =>
    api
      .get<
        {
          model: string;
          totalTokens: number;
          promptTokens: number;
          completionTokens: number;
          requestCount: number;
        }[]
      >('/logs/models')
      .then((r) => r.data),
};
