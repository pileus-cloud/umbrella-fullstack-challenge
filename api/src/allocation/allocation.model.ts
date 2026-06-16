import { Model, CloudOptions } from '../utils/Model';
import { AllocationSummaryFilters } from './allocation.validation';

export interface AllocationRecord {
  usageDate: string;
  currency: string;
  amount: number;
  governanceTagKey: string | null;
  governanceTagValue: string | null;
}

interface AllocationRecordRow {
  usage_date: string;
  currency: string;
  amount: string;
  governance_tag_key: string | null;
  governance_tag_value: string | null;
}

interface ExchangeRateRow {
  rate: string;
}

export class AllocationModel extends Model {
  constructor(cloudOptions: CloudOptions) {
    super(cloudOptions);
  }

  async listRecords(filters: AllocationSummaryFilters): Promise<AllocationRecord[]> {
    const result = await this.query<AllocationRecordRow>(
      `SELECT usage_date::text AS usage_date, currency, amount, governance_tag_key, governance_tag_value
       FROM usage_cost_records
       WHERE organization_id = $1 AND usage_date >= $2 AND usage_date <= $3
       ORDER BY usage_date ASC, id ASC`,
      [this.customerOrgId, filters.from, filters.to]
    );

    return result.rows.map((row) => ({
      usageDate: row.usage_date,
      currency: row.currency,
      amount: Number(row.amount),
      governanceTagKey: row.governance_tag_key,
      governanceTagValue: row.governance_tag_value,
    }));
  }

  async getCachedRate(date: string, fromCurrency: string, toCurrency: string): Promise<number | null> {
    const result = await this.query<ExchangeRateRow>(
      `SELECT rate
       FROM exchange_rate_cache
       WHERE rate_date = $1 AND from_currency = $2 AND to_currency = $3`,
      [date, fromCurrency, toCurrency]
    );

    return result.rows[0] ? Number(result.rows[0].rate) : null;
  }

  async cacheRate(date: string, fromCurrency: string, toCurrency: string, rate: number): Promise<void> {
    await this.query(
      `INSERT INTO exchange_rate_cache (rate_date, from_currency, to_currency, rate)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (rate_date, from_currency, to_currency)
       DO UPDATE SET rate = EXCLUDED.rate, fetched_at = NOW()`,
      [date, fromCurrency, toCurrency, rate]
    );
  }
}
