export type GovernanceRuleFieldName =
  | 'service'
  | 'region'
  | 'cloud_provider'
  | 'account_id'
  | 'native_tags';

const FIELD_ALIASES: Record<string, GovernanceRuleFieldName> = {
  service: 'service',
  region: 'region',
  cloudProvider: 'cloud_provider',
  cloud_provider: 'cloud_provider',
  accountId: 'account_id',
  account_id: 'account_id',
  nativeTags: 'native_tags',
  native_tags: 'native_tags',
};

export function normalizeGovernanceRuleFieldName(value: string): GovernanceRuleFieldName | null {
  return FIELD_ALIASES[value] ?? null;
}
