export interface ProviderBalanceInfo {
  balance: number;
  currency: string;
  rawData?: unknown;
}

export interface ProviderUsageInfo {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: number;
}

export interface ProviderPriceInfo {
  model: string;
  inputPricePer1M: number;
  outputPricePer1M: number;
  currency: string;
}

export interface ProviderAdapter {
  /** Fetch upstream account balance */
  fetchBalance(channel: {
    baseUrl: string;
    apiKey: string;
    balanceApiConfig?: string | null;
  }): Promise<ProviderBalanceInfo>;

  /** Fetch current billing/usage for a period */
  fetchUsage?(channel: {
    baseUrl: string;
    apiKey: string;
    balanceApiConfig?: string | null;
  }, startDate: Date, endDate: Date): Promise<ProviderUsageInfo>;

  /** Fetch model pricing from the provider */
  fetchPricing?(channel: {
    baseUrl: string;
    apiKey: string;
    balanceApiConfig?: string | null;
  }): Promise<ProviderPriceInfo[]>;
}
