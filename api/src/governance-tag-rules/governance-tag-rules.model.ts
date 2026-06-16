import { Model, CloudOptions } from '../utils/Model';
import {
  GOVERNANCE_TAG_RULE_COLUMNS,
  GovernanceTagRuleRow,
  mapGovernanceTagRuleRow,
} from './governance-tag-rules.mapper';
import {
  GovernanceTagRuleCreateInput,
  GovernanceTagRuleUpdateInput,
} from './governance-tag-rules.types';

export class GovernanceTagRulesModel extends Model {
  constructor(cloudOptions: CloudOptions) {
    super(cloudOptions);
  }

  async list() {
    const result = await this.query<GovernanceTagRuleRow>(
      `SELECT ${GOVERNANCE_TAG_RULE_COLUMNS}
       FROM governance_tag_rules
       WHERE organization_id = $1
       ORDER BY id ASC`,
      [this.customerOrgId]
    );

    return result.rows.map(mapGovernanceTagRuleRow);
  }

  async create(input: GovernanceTagRuleCreateInput) {
    const result = await this.query<GovernanceTagRuleRow>(
      `INSERT INTO governance_tag_rules (
         organization_id,
         name,
         match_type,
         field_name,
         pattern,
         target_tag_key,
         target_tag_value,
         priority,
         enabled
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, 100), COALESCE($9, true))
       RETURNING ${GOVERNANCE_TAG_RULE_COLUMNS}`,
      [
        this.customerOrgId,
        input.name,
        input.matchType,
        input.fieldName,
        input.pattern,
        input.targetTagKey,
        input.targetTagValue,
        input.priority ?? null,
        input.enabled ?? null,
      ]
    );

    return mapGovernanceTagRuleRow(result.rows[0]);
  }

  async update(id: number, input: GovernanceTagRuleUpdateInput) {
    const updates: string[] = [];
    const params: any[] = [this.customerOrgId, id];

    addUpdate(updates, params, 'name', input.name);
    addUpdate(updates, params, 'match_type', input.matchType);
    addUpdate(updates, params, 'field_name', input.fieldName);
    addUpdate(updates, params, 'pattern', input.pattern);
    addUpdate(updates, params, 'target_tag_key', input.targetTagKey);
    addUpdate(updates, params, 'target_tag_value', input.targetTagValue);
    addUpdate(updates, params, 'priority', input.priority);
    addUpdate(updates, params, 'enabled', input.enabled);
    updates.push('updated_at = NOW()');

    const result = await this.query<GovernanceTagRuleRow>(
      `UPDATE governance_tag_rules
       SET ${updates.join(', ')}
       WHERE organization_id = $1 AND id = $2
       RETURNING ${GOVERNANCE_TAG_RULE_COLUMNS}`,
      params
    );

    return result.rows[0] ? mapGovernanceTagRuleRow(result.rows[0]) : null;
  }

  async disable(id: number) {
    const result = await this.query<GovernanceTagRuleRow>(
      `UPDATE governance_tag_rules
       SET enabled = false, updated_at = NOW()
       WHERE organization_id = $1 AND id = $2
       RETURNING ${GOVERNANCE_TAG_RULE_COLUMNS}`,
      [this.customerOrgId, id]
    );

    return result.rows[0] ? mapGovernanceTagRuleRow(result.rows[0]) : null;
  }
}

function addUpdate(updates: string[], params: any[], column: string, value: unknown) {
  if (value === undefined) return;
  params.push(value);
  updates.push(`${column} = $${params.length}`);
}
