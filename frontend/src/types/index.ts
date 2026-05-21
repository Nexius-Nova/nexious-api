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
  inputPricePer1M: number | string;
  outputPricePer1M: number | string;
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

export interface Conversation {
  id: number;
  title: string;
  messages: string | any[];
  model: string;
  systemPrompt?: string | null;
  temperature?: number | null;
  maxTokens?: number | null;
  topP?: number | null;
  streamEnabled?: boolean | null;
  debugInfo?: string | null;
  imageUrl?: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  status: boolean;
  createdAt?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  type?: string;
}

/** Shared model type options used by Models and Channels views */
export const MODEL_TYPE_OPTIONS = [
  { value: 'text', label: '文本' },
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' },
  { value: 'audio', label: '音频' },
  { value: 'embedding', label: '嵌入' },
] as const;
