import { BadRequestParamsError } from '../middlewares/errors';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CURRENCY_RE = /^[A-Z]{3}$/;

export function requirePlainObject(value: unknown, message = 'Request body must be an object') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestParamsError(message);
  }
  return value as Record<string, unknown>;
}

export function assertRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BadRequestParamsError(`${fieldName} is required`);
  }
  return value.trim();
}

export function optionalString(
  body: Record<string, unknown>,
  fieldName: string
): string | undefined {
  if (body[fieldName] === undefined) return undefined;
  return assertRequiredString(body[fieldName], fieldName);
}

export function assertIsoDate(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || !ISO_DATE_RE.test(value)) {
    throw new BadRequestParamsError(`${fieldName} must be an ISO date in YYYY-MM-DD format`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new BadRequestParamsError(`${fieldName} must be a valid calendar date`);
  }

  return value;
}

export interface DateRange {
  from?: string;
  to?: string;
}

export function parseDateRange(query: any, options?: { required?: boolean }): DateRange {
  if (options?.required && (query.from === undefined || query.to === undefined)) {
    throw new BadRequestParamsError('from and to query params are required');
  }

  const range: DateRange = {};
  if (query.from !== undefined) range.from = assertIsoDate(query.from, 'from');
  if (query.to !== undefined) range.to = assertIsoDate(query.to, 'to');

  if (range.from && range.to && range.from > range.to) {
    throw new BadRequestParamsError('from must be on or before to');
  }

  return range;
}

export function assertCurrencyCode(value: unknown, fieldName = 'currency'): string {
  const currency = assertRequiredString(value, fieldName).toUpperCase();
  if (!CURRENCY_RE.test(currency)) {
    throw new BadRequestParamsError(`${fieldName} must be a 3-letter ISO currency code`);
  }
  return currency;
}

export function assertFiniteNumber(value: unknown, fieldName: string): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) {
    throw new BadRequestParamsError(`${fieldName} must be a finite number`);
  }
  return number;
}

export function assertInteger(value: unknown, fieldName: string): number {
  const number = Number(value);
  if (!Number.isInteger(number)) {
    throw new BadRequestParamsError(`${fieldName} must be an integer`);
  }
  return number;
}

export function assertPositiveInteger(value: unknown, fieldName: string): number {
  const number = assertInteger(value, fieldName);
  if (number < 1) {
    throw new BadRequestParamsError(`${fieldName} must be a positive integer`);
  }
  return number;
}

export function optionalInteger(
  body: Record<string, unknown>,
  fieldName: string
): number | undefined {
  if (body[fieldName] === undefined) return undefined;
  return assertInteger(body[fieldName], fieldName);
}

export function optionalBoolean(
  body: Record<string, unknown>,
  fieldName: string
): boolean | undefined {
  if (body[fieldName] === undefined) return undefined;
  if (typeof body[fieldName] !== 'boolean') {
    throw new BadRequestParamsError(`${fieldName} must be a boolean`);
  }
  return body[fieldName] as boolean;
}
