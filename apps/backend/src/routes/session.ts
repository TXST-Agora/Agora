import { Router } from 'express';
//import { createSessionCode} from '../controllers/sessionController.js';
import { createSessionCode, listSessionsWithTime } from '../controllers/sessionController.js';

const router = Router();

/**
 * POST /api/v1/session/code
 * Generates a new randomized alphanumeric session code
 */
router.post('/code', createSessionCode);

router.get('/', listSessionsWithTime);

export default router;

