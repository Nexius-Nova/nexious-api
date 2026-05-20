import axios from 'axios';
import { ProviderAdapter, ProviderBalanceInfo } from './provider-adapter.interface';

/**
 * Generic/configurable balance adapter.
 *
 * All behaviour is driven by the channel's balanceApiConfig JSON field:
 * {
 *   "balanceUrl": "https://api.example.com/v1/balance",   // full URL (required, or use "path")
 *   "path": "/v1/users/me/balance",                        // path appended to baseUrl (alternative to balanceUrl)
 *   "method": "GET",                                        // HTTP method, default GET
 *   "responsePath": "data.available_balance",               // dot-separated JSON path to balance value (required)
 *   "currency": "CNY",                                      // default currency, optional (falls back to channel.currency or "USD")
 *   "headers": {}                                           // extra headers merged with Authorization
 * }
 *
 * Example for Kimi / Moonshot:
 * {
 *   "balanceUrl": "https://api.moonshot.cn/v1/users/me/balance",
 *   "responsePath": "data.available_balance",
 *   "currency": "CNY"
 * }
 */
export class GenericAdapter implements ProviderAdapter {
  async fetchBalance(channel: {
    baseUrl: string;
    apiKey: string;
    balanceApiConfig?: string | null;
  }): Promise<ProviderBalanceInfo> {
    let config: Record<string, any> = {};
    if (channel.balanceApiConfig) {
      try {
        config = JSON.parse(channel.balanceApiConfig);
      } catch {
        throw new Error('balanceApiConfig is not valid JSON');
      }
    }

    // Resolve URL: balanceUrl takes precedence, otherwise path + baseUrl
    let url: string;
    if (config.balanceUrl) {
      url = config.balanceUrl;
    } else if (config.path) {
      const root = channel.baseUrl.replace(/\/$/, '').replace(/\/v\d+$/, '');
      url = `${root}${config.path}`;
    } else {
      throw new Error('balanceApiConfig must include "balanceUrl" or "path"');
    }

    const method: string = (config.method || 'GET').toUpperCase();
    const responsePath: string = config.responsePath;
    if (!responsePath) {
      throw new Error('balanceApiConfig must include "responsePath" (e.g., "data.available_balance")');
    }

    // Build headers
    const baseHeaders: Record<string, string> = {
      Authorization: `Bearer ${channel.apiKey}`,
    };
    if (config.headers && typeof config.headers === 'object') {
      Object.assign(baseHeaders, config.headers);
    }

    // Make the request
    let response: any;
    if (method === 'GET') {
      response = await axios.get(url, { headers: baseHeaders, timeout: 10000 });
    } else if (method === 'POST') {
      response = await axios.post(url, config.body || {}, { headers: baseHeaders, timeout: 10000 });
    } else {
      throw new Error(`Unsupported HTTP method: ${method}`);
    }

    const data = response.data;

    // Navigate the response JSON by dot-separated path to extract balance
    const balance = getByPath(data, responsePath);

    return {
      balance: Number(balance) || 0,
      currency: config.currency || 'USD',
      rawData: data,
    };
  }
}

/**
 * Navigate a nested object by dot-separated path.
 * e.g., getByPath({ data: { balance: 9.99 } }, "data.balance") → 9.99
 */
function getByPath(obj: any, path: string): any {
  return path.split('.').reduce((o, k) => (o != null ? o[k] : undefined), obj);
}
