export interface Channel {
  id: number | null;
  name: string;
  type: string;
  baseUrl: string;
  apiKey: string;
  models: string;
  modelTypes?: string | null;
  status: boolean;
  weight: number;
  visibility?: string;
  userId?: number | null;
  // Billing
  currency?: string;
  balanceEnabled?: boolean;
  balanceApiType?: string | null;
  balanceApiConfig?: string | null;
  lastBalance?: number | null;
  lastBalanceAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Token {
  id: number | null;
  name: string;
  key: string;
  status: boolean;
  quota: number;
  used: number;
  expiresAt?: string | null;
  allowedModels?: string | null;
  group?: string | null;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Log {
  id: number;
  tokenId: number | null;
  channelId: number | null;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  ip: string | null;
  // Cost fields
  inputCost?: number | string;
  outputCost?: number | string;
  totalCost?: number | string;
  currency?: string;
  isEstimated?: boolean;
  createdAt: string;
  token?: { name: string };
  channel?: { name: string };
}

export interface ModelPricing {
  id: number | null;
  channelId: number;
  model: string;
  inputPricePer1K: number | string;
  outputPricePer1K: number | string;
  currency: string;
  effectiveAt?: string;
  channel?: { id: number; name: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface BalanceSnapshot {
  id: number;
  channelId: number;
  balance: number;
  currency: string;
  fetchedAt: string;
}
