import {
  GovernanceTagRule,
  GovernanceTagRuleBase,
  GovernanceTagRuleMatchType,
} from './governance-tag-rules.types';

export const GOVERNANCE_TAG_RULE_BASE_COLUMNS =
  'id, name, match_type, field_name, pattern, target_tag_key, target_tag_value, priority, updated_at';

export const GOVERNANCE_TAG_RULE_COLUMNS =
  `${GOVERNANCE_TAG_RULE_BASE_COLUMNS}, enabled, created_at`;

export interface GovernanceTagRuleRow {
  id: string;
  name: string;
  match_type: GovernanceTagRuleMatchType;
  field_name: string;
  pattern: string;
  target_tag_key: string;
  target_tag_value: string;
  priority: number;
  enabled: boolean;
  updated_at: string;
  created_at: string;
}

export type GovernanceTagRuleBaseRow = Pick<
  GovernanceTagRuleRow,
  | 'id'
  | 'name'
  | 'match_type'
  | 'field_name'
  | 'pattern'
  | 'target_tag_key'
  | 'target_tag_value'
  | 'priority'
  | 'updated_at'
>;

export function mapGovernanceTagRuleBaseRow(row: GovernanceTagRuleBaseRow): GovernanceTagRuleBase {
  return {
    id: Number(row.id),
    name: row.name,
    matchType: row.match_type,
    fieldName: row.field_name,
    pattern: row.pattern,
    targetTagKey: row.target_tag_key,
    targetTagValue: row.target_tag_value,
    priority: row.priority,
    updatedAt: row.updated_at,
  };
}

export function mapGovernanceTagRuleRow(row: GovernanceTagRuleRow): GovernanceTagRule {
  return {
    ...mapGovernanceTagRuleBaseRow(row),
    enabled: row.enabled,
    createdAt: row.created_at,
  };
}
