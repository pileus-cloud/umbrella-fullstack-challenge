import { createRouter } from '../middlewares/routerWrapper';
import * as controller from './governance-tag-rules.controller';

const { router, get, post, patch } = createRouter();

get('/', controller.list);
post('/', controller.create, { roles: ['admin'] });
patch('/:id', controller.update, { roles: ['admin'] });
post('/:id/disable', controller.disable, { roles: ['admin'] });

export default router;
