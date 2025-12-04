import { Router } from 'express';
import { createSessionCode, createSessionEndpoint, getSession, addSessionAction } from '../controllers/sessionController.js';

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

/**
 * GET /api/session/:sessionCode
 * Retrieves a session by sessionCode
 */
router.get('/:sessionCode', getSession);

/**
 * POST /api/session/:sessionCode/action
 * Adds a new action (question/comment) to a session
 */
router.post('/:sessionCode/action', addSessionAction);

export default router;

