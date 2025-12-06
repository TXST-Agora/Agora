import { Router } from 'express';
import { createSessionCode, createSessionEndpoint, getSession, addSessionAction, getActionContentEndpoint, getActionsWithTimesEndpoint } from '../controllers/sessionController.js';

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
 * POST /api/session/:sessionCode/action
 * Adds a new action (question/comment) to a session
 */
router.post('/:sessionCode/action', addSessionAction);

/**
 * GET /api/session/:sessionCode/actions/times
 * Gets all actionIDs and their start_time for a specific session, along with time margins
 */
router.get('/:sessionCode/actions/times', getActionsWithTimesEndpoint);

/**
 * GET /api/session/:sessionCode/:actionID
 * Gets the content of a specific action by sessionCode and actionID
 */
router.get('/:sessionCode/:actionID', getActionContentEndpoint);

/**
 * GET /api/session/:sessionCode
 * Retrieves a session by sessionCode
 */
router.get('/:sessionCode', getSession);

export default router;

