export type GovernanceTagRuleMatchType = 'exact' | 'contains';

export interface GovernanceTagRuleBase {
  id: number;
  name: string;
  matchType: GovernanceTagRuleMatchType;
  fieldName: string;
  pattern: string;
  targetTagKey: string;
  targetTagValue: string;
  priority: number;
  updatedAt: string;
}

export interface GovernanceTagRule extends GovernanceTagRuleBase {
  enabled: boolean;
  createdAt: string;
}

export interface GovernanceTagRuleCreateInput {
  name: string;
  matchType: GovernanceTagRuleMatchType;
  fieldName: string;
  pattern: string;
  targetTagKey: string;
  targetTagValue: string;
  priority?: number;
  enabled?: boolean;
}

export interface GovernanceTagRuleUpdateInput {
  name?: string;
  matchType?: GovernanceTagRuleMatchType;
  fieldName?: string;
  pattern?: string;
  targetTagKey?: string;
  targetTagValue?: string;
  priority?: number;
  enabled?: boolean;
}
