import axios from 'axios';
import { ProviderAdapter, ProviderBalanceInfo } from './provider-adapter.interface';

/**
 * Adapter for DeepSeek balance API.
 * Endpoint: GET {baseUrl}/user/balance
 */
export class DeepSeekAdapter implements ProviderAdapter {
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

    const baseUrl = channel.baseUrl.replace(/\/$/, '');
    const url = config.balanceUrl || `${baseUrl}/user/balance`;

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${channel.apiKey}` },
      timeout: 10000,
    });

    const data = response.data;

    // DeepSeek response: { is_available, balance_infos: [{ currency, total_balance, ... }] }
    const infos = data.balance_infos || [];
    const primary = infos[0] || {};

    return {
      balance: Number(primary.total_balance) || 0,
      currency: primary.currency || 'CNY',
      rawData: data,
    };
  }
}
