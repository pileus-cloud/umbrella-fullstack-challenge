import { assertCurrencyCode, parseDateRange } from '../utils/validation';

export interface AllocationSummaryFilters {
  from: string;
  to: string;
  baseCurrency?: string;
}

export function parseSummaryFilters(query: any): AllocationSummaryFilters {
  const range = parseDateRange(query, { required: true });
  const filters: AllocationSummaryFilters = {
    from: range.from!,
    to: range.to!,
  };

  if (query.baseCurrency !== undefined) {
    filters.baseCurrency = assertCurrencyCode(query.baseCurrency, 'baseCurrency');
  }

  return filters;
}
