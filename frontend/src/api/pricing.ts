import api from './index';
import type { ModelPricing } from '../types';

export const pricingApi = {
  list: (channelId?: number) =>
    api
      .get<ModelPricing[]>('/model-pricing', {
        params: channelId ? { channelId } : undefined,
      })
      .then((r) => r.data),

  create: (data: Partial<ModelPricing>) =>
    api.post<ModelPricing>('/model-pricing', data).then((r) => r.data),

  update: (id: number, data: Partial<ModelPricing>) =>
    api.put<ModelPricing>(`/model-pricing/${id}`, data).then((r) => r.data),

  remove: (id: number) =>
    api.delete<void>(`/model-pricing/${id}`).then((r) => r.data),
};
