import { Router } from 'express';
import { createSessionCode, createSessionEndpoint, getSession, addSessionAction, getActionContentEndpoint, getActionsEndpoint, updateActionIcon } from '../controllers/sessionController.js';

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
 * PATCH /api/session/:sessionCode/action
 * Changes the actions array to exclude a certain element
 */
router.patch('/:sessionCode/action', removeSessionAction);

/**
 * GET /api/session/:sessionCode/actions/times
 * Gets all actionIDs and their start_time for a specific session, along with time margins
 */
router.get('/:sessionCode/actions/times', getActionsEndpoint);

/**
 * PATCH /api/session/:sessionCode/action/:actionID
 * Updates the size and color of a specific action
 */
router.patch('/:sessionCode/action/:actionID', updateActionIcon);

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

