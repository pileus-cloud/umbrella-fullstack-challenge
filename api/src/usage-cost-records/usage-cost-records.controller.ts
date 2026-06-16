import { Request, Response } from 'express';
import { CloudOptions } from '../utils/Model';
import { UsageCostRecordsService } from './usage-cost-records.service';
import { parseListFilters, validateBulkItems } from './usage-cost-records.validation';

export async function bulkIngest(req: Request, res: Response): Promise<void> {
  const items = validateBulkItems(req.body);
  const service = new UsageCostRecordsService(res.locals.cloudOptions as CloudOptions);
  const result = await service.bulkIngest(items);
  res.json(result);
}

export async function list(req: Request, res: Response): Promise<void> {
  const filters = parseListFilters(req.query);
  const service = new UsageCostRecordsService(res.locals.cloudOptions as CloudOptions);
  const result = await service.list(filters);
  res.json(result);
}
