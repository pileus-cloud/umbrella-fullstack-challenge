import { CloudOptions } from '../utils/Model';
import { AllocationModel, AllocationRecord } from './allocation.model';
import { AllocationSummaryFilters } from './allocation.validation';
import { ExchangeRateService } from './exchange-rate.service';

interface AllocationGroup {
  group: string;
  totalAmount: number;
  recordCount: number;
}

interface DisplayAmountResult {
  amount: number;
  warning?: string;
}

export class AllocationService {
  private model: AllocationModel;
  private exchangeRateService: ExchangeRateService;

  constructor(cloudOptions: CloudOptions) {
    this.model = new AllocationModel(cloudOptions);
    this.exchangeRateService = new ExchangeRateService(this.model);
  }

  async summary(filters: AllocationSummaryFilters) {
    const records = await this.model.listRecords(filters);
    const groups = new Map<string, AllocationGroup>();
    const warnings = new Set<string>();

    ensureGroup(groups, 'untagged');

    for (const record of records) {
      const group = getGroupName(record);
      const { amount, warning } = await this.getDisplayAmount(record, filters.baseCurrency);
      if (warning) warnings.add(warning);
      const current = ensureGroup(groups, group);
      current.totalAmount += amount;
      current.recordCount += 1;
    }

    return {
      baseCurrency: filters.baseCurrency ?? null,
      items: Array.from(groups.values())
        .sort(compareGroups)
        .map((item) => ({
          ...item,
          totalAmount: roundMoney(item.totalAmount),
        })),
      warnings: Array.from(warnings),
    };
  }

  private async getDisplayAmount(
    record: AllocationRecord,
    baseCurrency?: string
  ): Promise<DisplayAmountResult> {
    if (!baseCurrency) {
      return { amount: record.amount };
    }

    const sourceCurrency = record.currency.toUpperCase();
    const { rate, warning } = await this.exchangeRateService.getRate(
      record.usageDate,
      sourceCurrency,
      baseCurrency
    );
    return { amount: record.amount * rate, warning };
  }
}

function getGroupName(record: AllocationRecord): string {
  if (!record.governanceTagKey || !record.governanceTagValue) {
    return 'untagged';
  }
  return `${record.governanceTagKey}:${record.governanceTagValue}`;
}

function ensureGroup(groups: Map<string, AllocationGroup>, name: string): AllocationGroup {
  if (!groups.has(name)) {
    groups.set(name, { group: name, totalAmount: 0, recordCount: 0 });
  }
  return groups.get(name)!;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function compareGroups(a: AllocationGroup, b: AllocationGroup): number {
  if (a.group === 'untagged') return 1;
  if (b.group === 'untagged') return -1;
  return a.group.localeCompare(b.group);
}
