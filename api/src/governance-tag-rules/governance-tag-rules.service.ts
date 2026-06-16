import { NotFoundError } from '../middlewares/errors';
import { CloudOptions } from '../utils/Model';
import { GovernanceTagRulesModel } from './governance-tag-rules.model';
import {
  GovernanceTagRuleCreateInput,
  GovernanceTagRuleUpdateInput,
} from './governance-tag-rules.types';

export class GovernanceTagRulesService {
  private model: GovernanceTagRulesModel;

  constructor(cloudOptions: CloudOptions) {
    this.model = new GovernanceTagRulesModel(cloudOptions);
  }

  async list() {
    return this.model.list();
  }

  async create(input: GovernanceTagRuleCreateInput) {
    return this.model.create(input);
  }

  async update(id: number, input: GovernanceTagRuleUpdateInput) {
    const rule = await this.model.update(id, input);
    if (!rule) {
      throw new NotFoundError(`Governance tag rule "${id}" not found`);
    }
    return rule;
  }

  async disable(id: number) {
    const rule = await this.model.disable(id);
    if (!rule) {
      throw new NotFoundError(`Governance tag rule "${id}" not found`);
    }
    return rule;
  }
}
