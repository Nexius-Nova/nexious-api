import axios from 'axios';
import { ProviderAdapter, ProviderBalanceInfo } from './provider-adapter.interface';

/**
 * Adapter for Kimi / Moonshot balance API.
 * Official endpoint: GET https://api.moonshot.cn/v1/users/me/balance
 * Response: { data: { available_balance, voucher_balance, cash_balance } }
 * Currency: CNY
 */
export class KimiAdapter implements ProviderAdapter {
  async fetchBalance(channel: {
    baseUrl: string;
    apiKey: string;
    balanceApiConfig?: string | null;
  }): Promise<ProviderBalanceInfo> {
    let config: any = {};
    if (channel.balanceApiConfig) {
      try {
        config = JSON.parse(channel.balanceApiConfig);
      } catch {}
    }

    // Strip trailing slash and version path (e.g., /v1) — balance endpoint is at /v1/users/me/balance
    const root = channel.baseUrl.replace(/\/$/, '').replace(/\/v\d+$/, '');
    const url = config.balanceUrl || `${root}/v1/users/me/balance`;

    const response = await (async () => {
      try {
        return await axios.get(url, {
          headers: { Authorization: `Bearer ${channel.apiKey}` },
          timeout: 10000,
        });
      } catch (error: any) {
        const status = error.response?.status;
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(
          `Kimi balance API error${status ? ` (HTTP ${status})` : ''}: ${message}`,
        );
      }
    })();

    const data = response.data;

    // Kimi response: { data: { available_balance, voucher_balance, cash_balance } }
    const info = data?.data || {};

    return {
      balance: Number(info.available_balance) || 0,
      currency: 'CNY',
      rawData: data,
    };
  }
}
