import axios from 'axios';
import { ProviderAdapter, ProviderBalanceInfo } from './provider-adapter.interface';

/**
 * Adapter for OpenAI-compatible balance APIs.
 * Falls back to billing/usage endpoint if dedicated balance endpoint unavailable.
 */
export class OpenAIAdapter implements ProviderAdapter {
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

    // Try dedicated balance endpoint first
    const endpoints = [
      config.balanceUrl || `${baseUrl}/dashboard/billing/credit_grants`,
      `${baseUrl}/v1/dashboard/billing/usage`,
      `${baseUrl}/v1/usage`,
    ];

    // Remove duplicates while preserving order
    const uniqueEndpoints = [...new Set(endpoints)];

    for (const url of uniqueEndpoints) {
      try {
        let response;
        if (url.includes('/dashboard/billing/credit_grants')) {
          // OpenAI credit grants API
          response = await axios.get(url, {
            headers: { Authorization: `Bearer ${channel.apiKey}` },
            timeout: 10000,
          });
          const grants = response.data;
          const totalGranted = Number(grants.total_granted) || 0;
          const totalUsed = Number(grants.total_used) || 0;
          const balance = totalGranted - totalUsed;
          return {
            balance,
            currency: 'USD',
            rawData: grants,
          };
        }

        response = await axios.get(url, {
          headers: { Authorization: `Bearer ${channel.apiKey}` },
          timeout: 10000,
        });

        const data = response.data;
        // Try different response shapes
        if (data.remaining || data.remaining_credits !== undefined) {
          return {
            balance: Number(data.remaining ?? data.remaining_credits),
            currency: 'USD',
            rawData: data,
          };
        }
        if (data.total_balance !== undefined) {
          return {
            balance: Number(data.total_balance),
            currency: 'USD',
            rawData: data,
          };
        }
        if (data.balance !== undefined) {
          return {
            balance: Number(data.balance),
            currency: data.currency || 'USD',
            rawData: data,
          };
        }
      } catch (err: any) {
        // Try next endpoint
        continue;
      }
    }

    throw new Error('All balance endpoints failed for ' + baseUrl);
  }
}
