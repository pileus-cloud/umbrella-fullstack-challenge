import { Request, Response } from 'express';
import { CloudOptions } from '../utils/Model';
import { GovernanceTagRulesService } from './governance-tag-rules.service';
import { parseId, validateCreate, validateUpdate } from './governance-tag-rules.validation';

export async function list(req: Request, res: Response): Promise<void> {
  const service = new GovernanceTagRulesService(res.locals.cloudOptions as CloudOptions);
  const items = await service.list();
  res.json({ items });
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = validateCreate(req.body);
  const service = new GovernanceTagRulesService(res.locals.cloudOptions as CloudOptions);
  const rule = await service.create(input);
  res.status(201).json(rule);
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const input = validateUpdate(req.body);
  const service = new GovernanceTagRulesService(res.locals.cloudOptions as CloudOptions);
  const rule = await service.update(id, input);
  res.json(rule);
}

export async function disable(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const service = new GovernanceTagRulesService(res.locals.cloudOptions as CloudOptions);
  const rule = await service.disable(id);
  res.json(rule);
}
