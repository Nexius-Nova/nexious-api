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
        '/logs/stats/daily',
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
      >('/logs/stats/models')
      .then((r) => r.data),

  // Cost stats
  costStats: () =>
    api
      .get<{ totalCost: number; todayCost: number }>('/logs/stats/cost')
      .then((r) => r.data),

  dailyCost: (days: number) =>
    api
      .get<{ date: string; totalCost: number; requestCount: number }[]>(
        '/logs/stats/daily-cost',
        { params: { days } },
      )
      .then((r) => r.data),

  modelCosts: () =>
    api
      .get<
        {
          model: string;
          totalCost: number;
          inputCost: number;
          outputCost: number;
          requestCount: number;
        }[]
      >('/logs/stats/model-costs')
      .then((r) => r.data),

  channelCosts: () =>
    api
      .get<
        {
          channelId: number;
          channelName: string;
          totalCost: number;
          requestCount: number;
        }[]
      >('/logs/stats/channel-costs')
      .then((r) => r.data),
};

