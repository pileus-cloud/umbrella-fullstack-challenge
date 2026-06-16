import { Request, Response } from 'express';
import { CloudOptions } from '../utils/Model';
import { AllocationService } from './allocation.service';
import { parseSummaryFilters } from './allocation.validation';

export async function summary(req: Request, res: Response): Promise<void> {
  const filters = parseSummaryFilters(req.query);
  const service = new AllocationService(res.locals.cloudOptions as CloudOptions);
  const result = await service.summary(filters);
  res.json(result);
}
