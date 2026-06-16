import { CloudOptions } from '../utils/Model';
import { normalizeGovernanceRuleFieldName } from '../governance-tag-rules/governance-tag-fields';
import { GovernanceTagRuleBase } from '../governance-tag-rules/governance-tag-rules.types';
import { UsageCostRecordsModel } from './usage-cost-records.model';
import {
  MatchedGovernanceTag,
  UsageCostRecordInput,
  UsageCostRecordListFilters,
} from './usage-cost-records.types';

export class UsageCostRecordsService {
  private model: UsageCostRecordsModel;

  constructor(cloudOptions: CloudOptions) {
    this.model = new UsageCostRecordsModel(cloudOptions);
  }

  async bulkIngest(records: UsageCostRecordInput[]) {
    const rules = await this.model.listEnabledRules();
    const recordsWithTags = records.map((record) => ({
      ...record,
      ...matchGovernanceRule(record, rules),
    }));

    return this.model.bulkInsert(recordsWithTags);
  }

  async list(filters: UsageCostRecordListFilters) {
    return this.model.listRecords(filters);
  }
}

function matchGovernanceRule(
  record: UsageCostRecordInput,
  rules: GovernanceTagRuleBase[]
): Partial<MatchedGovernanceTag> & { explainability: Record<string, unknown> } {
  for (const rule of rules) {
    const fieldValue = getComparableFieldValue(record, rule.fieldName);
    if (fieldValue === null) continue;

    const matched =
      rule.matchType === 'exact'
        ? fieldValue === rule.pattern
        : fieldValue.toLowerCase().includes(rule.pattern.toLowerCase());

    if (matched) {
      return {
        governanceTagKey: rule.targetTagKey,
        governanceTagValue: rule.targetTagValue,
        matchedRuleId: rule.id,
        explainability: {
          matched: true,
          ruleId: rule.id,
          ruleName: rule.name,
          matchType: rule.matchType,
          fieldName: rule.fieldName,
          pattern: rule.pattern,
          fieldValue,
          targetTagKey: rule.targetTagKey,
          targetTagValue: rule.targetTagValue,
          priority: rule.priority,
          ruleUpdatedAt: rule.updatedAt,
          reason:
            rule.matchType === 'exact'
              ? `${rule.fieldName} exactly matched ${rule.pattern}`
              : `${rule.fieldName} contained ${rule.pattern} case-insensitively`,
        },
      };
    }
  }

  return {
    explainability: {
      matched: false,
      evaluatedRuleCount: rules.length,
      reason: 'No enabled governance tag rule matched this record',
    },
  };
}

function getComparableFieldValue(record: UsageCostRecordInput, fieldName: string): string | null {
  switch (normalizeGovernanceRuleFieldName(fieldName)) {
    case 'service':
      return record.service;
    case 'region':
      return record.region;
    case 'cloud_provider':
      return record.cloudProvider;
    case 'account_id':
      return record.accountId;
    case 'native_tags':
      return JSON.stringify(record.nativeTags ?? {});
    default:
      return null;
  }
}
