import { Router } from 'express';
import { createSessionCode, createSessionEndpoint } from '../controllers/sessionController.js';

const router = Router();

/**
 * POST /api/v1/session/code
 * Generates a new randomized alphanumeric session code
 */
router.post('/code', createSessionCode);

/**
 * POST /api/session/create
 * Creates a new session with mode field
 */
router.post('/create', createSessionEndpoint);

export default router;

