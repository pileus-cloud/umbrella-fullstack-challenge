import { PoolClient } from 'pg';
import { Model, CloudOptions } from '../utils/Model';
import {
  GOVERNANCE_TAG_RULE_BASE_COLUMNS,
  GovernanceTagRuleBaseRow,
  mapGovernanceTagRuleBaseRow,
} from '../governance-tag-rules/governance-tag-rules.mapper';
import { GovernanceTagRuleBase } from '../governance-tag-rules/governance-tag-rules.types';
import {
  MatchedGovernanceTag,
  UsageCostRecordInput,
  UsageCostRecordListFilters,
} from './usage-cost-records.types';

interface UsageCostRecordRow {
  id: string;
  external_id: string;
  cloud_provider: string;
  account_id: string;
  service: string;
  region: string;
  usage_date: string;
  currency: string;
  amount: string;
  resource_id: string;
  native_tags: Record<string, unknown>;
  governance_tag_key: string | null;
  governance_tag_value: string | null;
  matched_rule_id: string | null;
  explainability: Record<string, unknown> | null;
  created_at: string;
}

export class UsageCostRecordsModel extends Model {
  constructor(cloudOptions: CloudOptions) {
    super(cloudOptions);
  }

  async listEnabledRules(): Promise<GovernanceTagRuleBase[]> {
    const result = await this.query<GovernanceTagRuleBaseRow>(
      `SELECT ${GOVERNANCE_TAG_RULE_BASE_COLUMNS}
       FROM governance_tag_rules
       WHERE organization_id = $1 AND enabled = true AND match_type IN ('exact', 'contains')
       ORDER BY priority DESC, updated_at DESC, id DESC`,
      [this.customerOrgId]
    );

    return result.rows.map(mapGovernanceTagRuleBaseRow);
  }

  async bulkInsert(
    records: Array<UsageCostRecordInput & Partial<MatchedGovernanceTag>>
  ): Promise<{ ingested: number; deduplicated: number }> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      let ingested = 0;
      let deduplicated = 0;

      for (const record of records) {
        const inserted = await this.insertRecord(client, record);
        if (inserted) {
          ingested += 1;
        } else {
          deduplicated += 1;
        }
      }

      await client.query('COMMIT');
      return { ingested, deduplicated };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  private async insertRecord(
    client: PoolClient,
    record: UsageCostRecordInput & Partial<MatchedGovernanceTag>
  ): Promise<boolean> {
    const result = await client.query(
      `INSERT INTO usage_cost_records (
         external_id,
         organization_id,
         cloud_provider,
         account_id,
         service,
         region,
         usage_date,
         currency,
         amount,
         resource_id,
         native_tags,
         governance_tag_key,
         governance_tag_value,
         matched_rule_id,
         explainability
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, $14, $15::jsonb)
       ON CONFLICT (external_id, organization_id) DO NOTHING
       RETURNING id`,
      [
        record.externalId,
        this.customerOrgId,
        record.cloudProvider,
        record.accountId,
        record.service,
        record.region,
        record.usageDate,
        record.currency,
        record.amount,
        record.resourceId,
        JSON.stringify(record.nativeTags ?? {}),
        record.governanceTagKey ?? null,
        record.governanceTagValue ?? null,
        record.matchedRuleId ?? null,
        JSON.stringify(record.explainability ?? {}),
      ]
    );

    return result.rowCount === 1;
  }

  async listRecords(filters: UsageCostRecordListFilters) {
    const { whereSql, params } = this.buildListWhere(filters);
    const limit = filters.pageSize;
    const offset = (filters.page - 1) * filters.pageSize;

    const [itemsResult, countResult] = await Promise.all([
      this.query<UsageCostRecordRow>(
        `SELECT id, external_id, cloud_provider, account_id, service, region, usage_date::text AS usage_date,
                currency, amount, resource_id, native_tags, governance_tag_key,
                governance_tag_value, matched_rule_id, explainability, created_at
         FROM usage_cost_records
         ${whereSql}
         ORDER BY usage_date DESC, id DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      this.query<{ total: string }>(
        `SELECT COUNT(*)::text AS total
         FROM usage_cost_records
         ${whereSql}`,
        params
      ),
    ]);

    return {
      items: itemsResult.rows.map(mapUsageCostRecordRow),
      total: Number(countResult.rows[0]?.total ?? 0),
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  private buildListWhere(filters: UsageCostRecordListFilters) {
    const clauses = ['organization_id = $1'];
    const params: any[] = [this.customerOrgId];

    if (filters.from) {
      params.push(filters.from);
      clauses.push(`usage_date >= $${params.length}`);
    }
    if (filters.to) {
      params.push(filters.to);
      clauses.push(`usage_date <= $${params.length}`);
    }
    if (filters.governanceTagKey) {
      params.push(filters.governanceTagKey);
      clauses.push(`governance_tag_key = $${params.length}`);
    }
    if (filters.governanceTagValue) {
      params.push(filters.governanceTagValue);
      clauses.push(`governance_tag_value = $${params.length}`);
    }

    return {
      whereSql: `WHERE ${clauses.join(' AND ')}`,
      params,
    };
  }
}

function mapUsageCostRecordRow(row: UsageCostRecordRow) {
  return {
    id: Number(row.id),
    externalId: row.external_id,
    cloudProvider: row.cloud_provider,
    accountId: row.account_id,
    service: row.service,
    region: row.region,
    usageDate: row.usage_date,
    currency: row.currency,
    amount: Number(row.amount),
    resourceId: row.resource_id,
    nativeTags: row.native_tags,
    governanceTagKey: row.governance_tag_key,
    governanceTagValue: row.governance_tag_value,
    matchedRuleId: row.matched_rule_id ? Number(row.matched_rule_id) : null,
    explainability: row.explainability,
    createdAt: row.created_at,
  };
}
