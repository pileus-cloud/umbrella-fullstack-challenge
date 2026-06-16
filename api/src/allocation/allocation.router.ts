import { createRouter } from '../middlewares/routerWrapper';
import * as controller from './allocation.controller';

const { router, get } = createRouter();

get('/summary', controller.summary);

export default router;
