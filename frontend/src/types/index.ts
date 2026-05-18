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
  createdAt: string;
  token?: { name: string };
  channel?: { name: string };
}
