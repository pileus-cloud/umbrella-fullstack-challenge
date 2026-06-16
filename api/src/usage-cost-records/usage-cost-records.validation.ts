import { BadRequestParamsError } from '../middlewares/errors';
import {
  assertCurrencyCode,
  assertFiniteNumber,
  assertIsoDate,
  assertPositiveInteger,
  assertRequiredString,
  parseDateRange,
  requirePlainObject,
} from '../utils/validation';
import { UsageCostRecordInput, UsageCostRecordListFilters } from './usage-cost-records.types';

function assertNativeTags(value: unknown): Record<string, unknown> {
  if (value === undefined || value === null) {
    return {};
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestParamsError('nativeTags must be an object');
  }
  return value as Record<string, unknown>;
}

export function validateBulkItems(body: unknown): UsageCostRecordInput[] {
  const bodyObject = requirePlainObject(body, 'Request body must include an items array');
  if (!Array.isArray(bodyObject.items)) {
    throw new BadRequestParamsError('Request body must include an items array');
  }

  const items = bodyObject.items;
  if (items.length === 0) {
    throw new BadRequestParamsError('items must include at least one record');
  }

  return items.map((item, index) => {
    const record = requirePlainObject(item, `items[${index}] must be an object`);

    return {
      externalId: assertRequiredString(record.externalId, `items[${index}].externalId`),
      cloudProvider: assertRequiredString(record.cloudProvider, `items[${index}].cloudProvider`),
      accountId: assertRequiredString(record.accountId, `items[${index}].accountId`),
      service: assertRequiredString(record.service, `items[${index}].service`),
      region: assertRequiredString(record.region, `items[${index}].region`),
      usageDate: assertIsoDate(record.usageDate, `items[${index}].usageDate`),
      currency: assertCurrencyCode(record.currency),
      amount: assertFiniteNumber(record.amount, `items[${index}].amount`),
      resourceId: assertRequiredString(record.resourceId, `items[${index}].resourceId`),
      nativeTags: assertNativeTags(record.nativeTags),
    };
  });
}

export function parseListFilters(query: any): UsageCostRecordListFilters {
  const page = query.page === undefined ? 1 : Number(query.page);
  const pageSize = query.pageSize === undefined ? 20 : Number(query.pageSize);
  const dateRange = parseDateRange(query);

  assertPositiveInteger(page, 'page');
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new BadRequestParamsError('pageSize must be an integer between 1 and 100');
  }

  const filters: UsageCostRecordListFilters = { page, pageSize, ...dateRange };
  if (query.governanceTagKey !== undefined) {
    filters.governanceTagKey = assertRequiredString(query.governanceTagKey, 'governanceTagKey');
  }
  if (query.governanceTagValue !== undefined) {
    filters.governanceTagValue = assertRequiredString(
      query.governanceTagValue,
      'governanceTagValue'
    );
  }

  return filters;
}
