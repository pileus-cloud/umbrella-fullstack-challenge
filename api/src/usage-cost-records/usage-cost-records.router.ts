import { createRouter } from '../middlewares/routerWrapper';
import * as controller from './usage-cost-records.controller';

const { router, get, post } = createRouter();

get('/', controller.list);
post('/bulk', controller.bulkIngest, { roles: ['admin'] });

export default router;
