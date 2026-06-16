import { BadRequestParamsError } from '../middlewares/errors';
import {
  assertPositiveInteger,
  assertRequiredString,
  optionalBoolean,
  optionalInteger,
  optionalString,
  requirePlainObject,
} from '../utils/validation';
import { normalizeGovernanceRuleFieldName } from './governance-tag-fields';
import {
  GovernanceTagRuleCreateInput,
  GovernanceTagRuleMatchType,
  GovernanceTagRuleUpdateInput,
} from './governance-tag-rules.types';

const ALLOWED_MATCH_TYPES = new Set(['exact', 'contains']);
export function parseId(value: unknown): number {
  return assertPositiveInteger(value, 'id');
}

function assertMatchType(value: unknown): GovernanceTagRuleMatchType {
  const matchType = assertRequiredString(value, 'matchType');
  if (!ALLOWED_MATCH_TYPES.has(matchType)) {
    throw new BadRequestParamsError('matchType must be exact or contains');
  }
  return matchType as GovernanceTagRuleMatchType;
}

function optionalMatchType(body: Record<string, unknown>): GovernanceTagRuleMatchType | undefined {
  if (body.matchType === undefined) return undefined;
  return assertMatchType(body.matchType);
}

function assertFieldName(value: unknown): string {
  const fieldName = assertRequiredString(value, 'fieldName');
  const normalizedFieldName = normalizeGovernanceRuleFieldName(fieldName);
  if (!normalizedFieldName) {
    throw new BadRequestParamsError(
      'fieldName must be one of service, region, cloudProvider, accountId, nativeTags'
    );
  }
  return normalizedFieldName;
}

function optionalFieldName(body: Record<string, unknown>): string | undefined {
  if (body.fieldName === undefined) return undefined;
  return assertFieldName(body.fieldName);
}

function optionalPriority(body: Record<string, unknown>): number | undefined {
  return optionalInteger(body, 'priority');
}

export function validateCreate(body: unknown): GovernanceTagRuleCreateInput {
  const obj = requirePlainObject(body);
  return {
    name: assertRequiredString(obj.name, 'name'),
    matchType: assertMatchType(obj.matchType),
    fieldName: assertFieldName(obj.fieldName),
    pattern: assertRequiredString(obj.pattern, 'pattern'),
    targetTagKey: assertRequiredString(obj.targetTagKey, 'targetTagKey'),
    targetTagValue: assertRequiredString(obj.targetTagValue, 'targetTagValue'),
    priority: optionalPriority(obj),
    enabled: optionalBoolean(obj, 'enabled'),
  };
}

export function validateUpdate(body: unknown): GovernanceTagRuleUpdateInput {
  const obj = requirePlainObject(body);
  const update: GovernanceTagRuleUpdateInput = {
    name: optionalString(obj, 'name'),
    matchType: optionalMatchType(obj),
    fieldName: optionalFieldName(obj),
    pattern: optionalString(obj, 'pattern'),
    targetTagKey: optionalString(obj, 'targetTagKey'),
    targetTagValue: optionalString(obj, 'targetTagValue'),
    priority: optionalPriority(obj),
    enabled: optionalBoolean(obj, 'enabled'),
  };

  const hasUpdate = Object.values(update).some((value) => value !== undefined);
  if (!hasUpdate) {
    throw new BadRequestParamsError('At least one updatable field is required');
  }

  return update;
}
