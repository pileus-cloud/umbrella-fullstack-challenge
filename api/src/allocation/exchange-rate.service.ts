import axios from 'axios';
import { AllocationModel } from './allocation.model';

interface FrankfurterRateResponse {
  date: string;
  base: string;
  quote: string;
  rate: number;
}

interface ExchangeRateResult {
  rate: number;
  warning?: string;
}

export class ExchangeRateService {
  private lookups = new Map<string, Promise<ExchangeRateResult>>();

  constructor(private model: AllocationModel) {}

  async getRate(
    date: string,
    fromCurrency: string,
    toCurrency: string
  ): Promise<ExchangeRateResult> {
    if (fromCurrency === toCurrency) {
      return { rate: 1 };
    }

    const cacheKey = `${date}:${fromCurrency}:${toCurrency}`;
    if (!this.lookups.has(cacheKey)) {
      this.lookups.set(cacheKey, this.lookupRate(date, fromCurrency, toCurrency));
    }

    return this.lookups.get(cacheKey)!;
  }

  private async lookupRate(
    date: string,
    fromCurrency: string,
    toCurrency: string
  ): Promise<ExchangeRateResult> {
    const cachedRate = await this.model.getCachedRate(date, fromCurrency, toCurrency);
    if (cachedRate !== null) {
      return { rate: cachedRate };
    }

    const rate = await this.fetchRate(date, fromCurrency, toCurrency);
    if (rate === null) {
      return {
        rate: 1,
        warning:
          `Unable to fetch exchange rate for ${fromCurrency}->${toCurrency} on ${date}; ` +
          `amount was left in ${fromCurrency}`,
      };
    }

    await this.model.cacheRate(date, fromCurrency, toCurrency, rate);
    return { rate };
  }

  private async fetchRate(
    date: string,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number | null> {
    try {
      const response = await axios.get<FrankfurterRateResponse>(
        `https://api.frankfurter.dev/v2/rate/${fromCurrency}/${toCurrency}/${date}`,
        { timeout: 5000 }
      );

      const rate = Number(response.data.rate);
      if (!Number.isFinite(rate) || rate <= 0) {
        throw new Error('Invalid exchange rate response');
      }

      return rate;
    } catch (err) {
      return null;
    }
  }
}
