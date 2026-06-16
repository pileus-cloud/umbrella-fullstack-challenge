export interface UsageCostRecordInput {
  externalId: string;
  cloudProvider: string;
  accountId: string;
  service: string;
  region: string;
  usageDate: string;
  currency: string;
  amount: number;
  resourceId: string;
  nativeTags?: Record<string, unknown>;
}

export interface MatchedGovernanceTag {
  governanceTagKey: string;
  governanceTagValue: string;
  matchedRuleId: number;
  explainability: Record<string, unknown>;
}

export interface UsageCostRecordListFilters {
  from?: string;
  to?: string;
  governanceTagKey?: string;
  governanceTagValue?: string;
  page: number;
  pageSize: number;
}
