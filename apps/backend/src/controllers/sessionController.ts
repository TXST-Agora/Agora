import { type Request, type Response } from 'express';
import { randomUUID } from 'crypto';
import { createSession, createSessionWithMode, getActionContent, getActions } from '../services/sessionService.js';
import '../../db/connection.js';
// @ts-ignore - JS file without type definitions
import Session from '../../db/session-schema.js';

/**
 * Controller for session-related HTTP endpoints.
 * Handles all session management operations including creation, retrieval,
 * and action (question/comment) management.
 * 
 * @module sessionController
 */

const MIN_TITLE_LENGTH = 3;
const MAX_DESCRIPTION_LENGTH = 200;
const VALID_SESSION_TYPES = ['normal', 'colorShift', 'sizePulse'] as const;
const VALID_MODES = ['normal', 'colorShift', 'sizePulse'] as const;

/**
 * Creates a new session with a generated session code (legacy endpoint).
 * 
 * @async
 * @function createSessionCode
 * @param {Request} req - Express request object
 * @param {string} req.body.title - Session title (min 3 characters, required)
 * @param {string} [req.body.description] - Session description (max 200 characters, optional)
 * @param {string} req.body.sessionType - Type of session (required, one of: 'normal', 'colorShift', 'sizePulse')
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * 
 * @example
 * // Request
 * POST /api/v1/session/code
 * {
 *   "title": "Advanced TypeScript Workshop",
 *   "description": "Learn advanced TS concepts",
 *   "sessionType": "normal"
 * }
 * 
 * // Response (201 Created)
 * {
 *   "code": "abc123",
 *   "id": "507f1f77bcf86cd799439011",
 *   "title": "Advanced TypeScript Workshop",
 *   "description": "Learn advanced TS concepts",
 *   "sessionType": "normal"
 * }
 * 
 * @throws {400} Invalid input (missing/invalid title, sessionType, or oversized description)
 * @throws {500} Database error
 */
export const createSessionCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, sessionType } = req.body;

    // Validate required fields
    if (!title || typeof title !== 'string') {
      res.status(400).json({ 
        message: 'Title is required and must be a string' 
      });
      return;
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      res.status(400).json({ 
        message: 'Title cannot be empty' 
      });
      return;
    }

    if (trimmedTitle.length < MIN_TITLE_LENGTH) {
      res.status(400).json({ 
        message: `Title must be at least ${MIN_TITLE_LENGTH} characters` 
      });
      return;
    }

    if (!sessionType || typeof sessionType !== 'string') {
      res.status(400).json({ 
        message: 'Session type is required and must be a string' 
      });
      return;
    }

    if (!VALID_SESSION_TYPES.includes(sessionType as typeof VALID_SESSION_TYPES[number])) {
      res.status(400).json({ 
        message: `Session type must be one of: ${VALID_SESSION_TYPES.join(', ')}` 
      });
      return;
    }

    // Validate description if provided
    const trimmedDescription = description?.trim() || '';
    if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
      res.status(400).json({ 
        message: `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters` 
      });
      return;
    }

    const session = await createSession({
      title: trimmedTitle,
      description: trimmedDescription,
      sessionType,
      length: 6
    });

    res.status(201).json({ 
      code: session.sessionID,
      id: session._id,
      title: session.title,
      description: session.description,
      sessionType: session.sessionType
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to generate session code', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};

/**
 * Creates a new session with a 'mode' field for host response modes.
 * This is the primary session creation endpoint.
 * 
 * @async
 * @function createSessionEndpoint
 * @param {Request} req - Express request object
 * @param {string} req.body.title - Session title (min 3 characters, required)
 * @param {string} [req.body.description] - Session description (max 200 characters, optional)
 * @param {string} req.body.mode - Host response mode (required, one of: 'normal', 'colorShift', 'sizePulse')
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * 
 * @example
 * // Request
 * POST /api/session/create
 * {
 *   "title": "Q&A Session",
 *   "description": "Interactive Q&A",
 *   "mode": "colorShift"
 * }
 * 
 * // Response (201 Created)
 * {
 *   "sessionCode": "XyZ9aB",
 *   "title": "Q&A Session",
 *   "description": "Interactive Q&A",
 *   "mode": "colorShift",
 *   "hostStartTime": "2025-12-08T10:30:00.000Z",
 *   "actions": []
 * }
 * 
 * @throws {400} Invalid input (missing/invalid title, mode, or oversized description)
 * @throws {500} Database error
 */
export const createSessionEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, mode } = req.body;

    // Validate required fields
    if (!title || typeof title !== 'string') {
      res.status(400).json({ 
        message: 'Title is required and must be a string' 
      });
      return;
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      res.status(400).json({ 
        message: 'Title cannot be empty' 
      });
      return;
    }

    if (trimmedTitle.length < MIN_TITLE_LENGTH) {
      res.status(400).json({ 
        message: `Title must be at least ${MIN_TITLE_LENGTH} characters` 
      });
      return;
    }

    if (!mode || typeof mode !== 'string') {
      res.status(400).json({ 
        message: 'Mode is required and must be a string' 
      });
      return;
    }

    if (!VALID_MODES.includes(mode as typeof VALID_MODES[number])) {
      res.status(400).json({ 
        message: `Mode must be one of: ${VALID_MODES.join(', ')}` 
      });
      return;
    }

    // Validate description if provided
    const trimmedDescription = description?.trim() || '';
    if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
      res.status(400).json({ 
        message: `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters` 
      });
      return;
    }

    const session = await createSessionWithMode({
      title: trimmedTitle,
      description: trimmedDescription,
      mode,
    });

    res.status(201).json({
      sessionCode: session.sessionCode,
      title: session.title,
      description: session.description,
      mode: session.mode,
      hostStartTime: session.hostStartTime,
      actions: session.actions,
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to create session', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};

/**
 * Retrieves a session by its session code.
 * Returns all session details including actions/questions/comments.
 * 
 * @async
 * @function getSession
 * @param {Request} req - Express request object
 * @param {string} req.params.sessionCode - Unique session code (required)
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * 
 * @example
 * // Request
 * GET /api/session/XyZ9aB
 * 
 * // Response (200 OK)
 * {
 *   "sessionCode": "XyZ9aB",
 *   "title": "Q&A Session",
 *   "description": "Interactive Q&A",
 *   "mode": "colorShift",
 *   "hostStartTime": "2025-12-08T10:30:00.000Z",
 *   "actions": [
 *     {
 *       "id": "550e8400-e29b-41d4-a716-446655440000",
 *       "actionID": 1,
 *       "type": "question",
 *       "content": "What is TypeScript?",
 *       "start_time": "2025-12-08T10:31:00.000Z",
 *       "size": 48,
 *       "color": "#16a34a"
 *     }
 *   ]
 * }
 * 
 * @throws {404} Session not found
 * @throws {500} Database error
 */
export const getSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionCode } = req.params;

    const session = await Session.findOne({ sessionCode });
    if (!session) {
      res.status(404).json({ 
        message: 'Session not found' 
      });
      return;
    }

    res.status(200).json({
      sessionCode: session.sessionCode,
      title: session.title,
      description: session.description,
      mode: session.mode,
      hostStartTime: session.hostStartTime,
      actions: session.actions || [],
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to retrieve session', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};

/**
 * Adds a new action (question or comment) to a session.
 * Creates a new action entry with auto-generated UUID and stores it in the session.
 * 
 * @async
 * @function addSessionAction
 * @param {Request} req - Express request object
 * @param {string} req.params.sessionCode - Session code (required)
 * @param {string} req.body.type - Action type: 'question' or 'comment' (required)
 * @param {string} req.body.content - Action content/text (required, non-empty)
 * @param {number} req.body.actionID - Unique action ID from frontend (required, positive integer)
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * 
 * @example
 * // Request
 * POST /api/session/XyZ9aB/action
 * {
 *   "type": "question",
 *   "content": "What is the best practice for error handling?",
 *   "actionID": 1
 * }
 * 
 * // Response (201 Created)
 * {
 *   "message": "Action added",
 *   "action": {
 *     "id": "550e8400-e29b-41d4-a716-446655440000",
 *     "actionID": 1,
 *     "type": "question",
 *     "content": "What is the best practice for error handling?",
 *     "start_time": "2025-12-08T10:31:00.000Z",
 *     "size": 48,
 *     "color": "#16a34a"
 *   }
 * }
 * 
 * @throws {400} Invalid input (missing/invalid type, content, or actionID)
 * @throws {404} Session not found
 * @throws {500} Database error or failed to persist action
 */
export const addSessionAction = async (req: Request, res: Response): Promise<void> => {
  // Extract variables early so they're available in catch block
  const { sessionCode } = req.params;
  const { type, content, actionID } = req.body;
  
  try {

    // Validate required fields
    if (!type || typeof type !== 'string') {
      res.status(400).json({ 
        message: 'type is required and must be a string' 
      });
      return;
    }

    if (!content || typeof content !== 'string') {
      res.status(400).json({ 
        message: 'content is required and must be a string' 
      });
      return;
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      res.status(400).json({ 
        message: 'content cannot be empty' 
      });
      return;
    }

    // Validate action type
    const validActionTypes = ['question', 'comment'] as const;
    if (!validActionTypes.includes(type as typeof validActionTypes[number])) {
      res.status(400).json({ 
        message: `type must be one of: ${validActionTypes.join(', ')}` 
      });
      return;
    }

    // Validate actionID
    if (actionID === undefined || actionID === null) {
      res.status(400).json({ 
        message: 'actionID is required' 
      });
      return;
    }

    const numericActionID = typeof actionID === 'string' ? parseInt(actionID, 10) : Number(actionID);
    if (isNaN(numericActionID) || numericActionID < 1 || !Number.isInteger(numericActionID)) {
      res.status(400).json({ 
        message: 'actionID must be a positive integer' 
      });
      return;
    }

    // Find the session
    const session = await Session.findOne({ sessionCode });
    if (!session) {
      res.status(404).json({ 
        message: 'Session not found' 
      });
      return;
    }

    // Calculate initial size and color based on session mode
    // Default values for normal mode
    let initialSize = 48;
    let initialColor = '#16a34a'; // green-600

    // Create new action with actionID from frontend
    const newAction = {
      id: randomUUID(),
      actionID: numericActionID,
      type,
      content: trimmedContent,
      start_time: new Date(),
      size: initialSize,
      color: initialColor,
    };

    // Add action to session
    if (!session.actions) {
      session.actions = [];
    }
    // Reassign the entire array to ensure Mongoose detects the change
    // This is more reliable than push() with Schema.Types.Mixed
    session.actions = [...session.actions, newAction];
    // Mark actions array as modified to ensure Mongoose saves nested changes
    session.markModified('actions');
    
    // Save the session and verify it was saved
    const savedSession = await session.save();
    
    // Verify the action was actually saved
    if (!savedSession.actions || !savedSession.actions.some((a: any) => a.id === newAction.id)) {
      console.error('Action was not saved to database:', { sessionCode, newAction });
      res.status(500).json({ 
        message: 'Failed to save action to database', 
        error: 'Action was not persisted' 
      });
      return;
    }

    console.log('Action successfully saved:', { type, actionID: numericActionID, sessionCode });

    res.status(201).json({ 
      message: 'Action added', 
      action: newAction 
    });
  } catch (error) {
    console.error('Error adding action to session:', error instanceof Error ? error.message : String(error), { 
      sessionCode: sessionCode || 'unknown', 
      type: type || 'unknown', 
      actionID: actionID || 'unknown' 
    });
    res.status(500).json({ 
      message: 'Failed to add action', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};

/**
 * Removes one or more actions from a session by replacing the entire actions array.
 * Used for bulk action management and element removal from DOM.
 * 
 * @async
 * @function removeSessionAction
 * @param {Request} req - Express request object
 * @param {string} req.params.sessionCode - Session code (required)
 * @param {Array} req.body - Array of action objects to keep (required)
 * @param {string} req.body[].id - Unique action UUID (required for each action)
 * @param {number} req.body[].actionID - Numeric action ID (required for each action)
 * @param {string} req.body[].type - Action type: 'question' or 'comment' (required)
 * @param {string} req.body[].content - Action content (required for each action)
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * 
 * @example
 * // Request - Remove one action by passing remaining actions
 * PATCH /api/session/XyZ9aB/action
 * [
 *   {
 *     "id": "550e8400-e29b-41d4-a716-446655440001",
 *     "actionID": 2,
 *     "type": "comment",
 *     "content": "Great session!",
 *     "start_time": "2025-12-08T10:32:00.000Z",
 *     "size": 48,
 *     "color": "#16a34a"
 *   }
 * ]
 * 
 * // Response (200 OK)
 * {
 *   "message": "Actions updated",
 *   "actions": [
 *     {
 *       "id": "550e8400-e29b-41d4-a716-446655440001",
 *       "actionID": 2,
 *       "type": "comment",
 *       "content": "Great session!",
 *       "start_time": "2025-12-08T10:32:00.000Z",
 *       "size": 48,
 *       "color": "#16a34a"
 *     }
 *   ]
 * }
 * 
 * @throws {400} Invalid input (missing sessionCode, invalid array format, or missing required action fields)
 * @throws {404} Session not found
 * @throws {500} Database error or failed to persist actions
 */
export const removeSessionAction = async (req: Request, res: Response): Promise<void> => {
  const { sessionCode } = req.params;

  try {
    // Validate sessionCode
    if (!sessionCode) {
      res.status(400).json({ 
        message: 'sessionCode is required' 
      });
      return;
    }

    // Validate request body
    if (!Array.isArray(req.body)) {
      res.status(400).json({ 
        message: 'Request body must be an array of actions' 
      });
      return;
    }

    // Find the session
    const session = await Session.findOne({ sessionCode });
    if (!session) {
      res.status(404).json({ 
        message: 'Session not found' 
      });
      return;
    }

    // Validate each action in the array has required fields
    for (const action of req.body) {
      if (!action.id || !action.actionID || !action.type || !action.content) {
        res.status(400).json({ 
          message: 'Each action must have id, actionID, type, and content fields' 
        });
        return;
      }
    }


    // Update the actions array
    session.actions = req.body;

    // Mark actions array as modified to ensure Mongoose saves nested changes
    session.markModified('actions');
    
    // Save the session and verify it was saved
    const savedSession = await session.save();
    console.log('[removeSessionAction] Session saved, actions count:', savedSession.actions?.length || 0);
    
    // Verify the actions were actually saved
    if (!savedSession.actions || !Array.isArray(savedSession.actions)) {
      console.error('Actions were not saved to database:', { sessionCode });
      res.status(500).json({ 
        message: 'Failed to save actions to database', 
        error: 'Actions array was not persisted' 
      });
      return;
    }

    console.log('Actions successfully updated:', { sessionCode, actionCount: savedSession.actions.length });

    res.status(200).json({ 
      message: 'Actions updated', 
      actions: savedSession.actions
    });
    
  } catch (error) {
    console.error('Error updating actions for session:', error instanceof Error ? error.message : String(error), {
      sessionCode: sessionCode || 'unknown'
    });
    console.error('Full error:', error);
    res.status(500).json({ 
      message: 'Failed to update actions', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};

/**
 * Retrieves the content of a specific action by session code and action ID.
 * 
 * @async
 * @function getActionContentEndpoint
 * @param {Request} req - Express request object
 * @param {string} req.params.sessionCode - Session code (required)
 * @param {string|number} req.params.actionID - Numeric action ID (required)
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * 
 * @example
 * // Request
 * GET /api/session/XyZ9aB/1
 * 
 * // Response (200 OK)
 * {
 *   "content": "What is the difference between var and let?"
 * }
 * 
 * @throws {400} Invalid input (missing or invalid actionID)
 * @throws {404} Session not found or action not found
 * @throws {500} Database error
 */
export const getActionContentEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionCode, actionID } = req.params;

    if (!sessionCode) {
      res.status(400).json({ error: 'sessionCode is required' });
      return;
    }

    if (!actionID) {
      res.status(400).json({ error: 'actionID is required' });
      return;
    }

    // Parse actionID to integer
    const numericActionID = parseInt(actionID, 10);
    if (isNaN(numericActionID)) {
      res.status(400).json({ error: 'actionID must be a valid number' });
      return;
    }

    const content = await getActionContent(sessionCode, numericActionID);

    res.json({
      content,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Session not found') {
        res.status(404).json({ error: 'Session not found' });
        return;
      }
      if (error.message === 'Action not found') {
        // Need to get sessionCode for the error response
        const { sessionCode, actionID } = req.params;
        const numericActionID = actionID ? parseInt(actionID, 10) : NaN;
        res.status(404).json({ 
          error: 'Action not found',
          sessionCode: sessionCode || '',
          actionID: isNaN(numericActionID) ? undefined : numericActionID
        });
        return;
      }
    }
    console.error('Error fetching action content from database: ', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
};

/**
 * Retrieves all actions for a specific session with their metadata.
 * Includes time, size, and color information for each action.
 * 
 * @async
 * @function getActionsEndpoint
 * @param {Request} req - Express request object
 * @param {string} req.params.sessionCode - Session code (required)
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * 
 * @example
 * // Request
 * GET /api/session/XyZ9aB/actions/times
 * 
 * // Response (200 OK)
 * {
 *   "actions": [
 *     {
 *       "id": "550e8400-e29b-41d4-a716-446655440000",
 *       "actionID": 1,
 *       "type": "question",
 *       "content": "What is TypeScript?",
 *       "start_time": "2025-12-08T10:31:00.000Z",
 *       "size": 48,
 *       "color": "#16a34a"
 *     },
 *     {
 *       "id": "550e8400-e29b-41d4-a716-446655440001",
 *       "actionID": 2,
 *       "type": "comment",
 *       "content": "Great explanation",
 *       "start_time": "2025-12-08T10:32:00.000Z",
 *       "size": 48,
 *       "color": "#16a34a"
 *     }
 *   ]
 * }
 * 
 * @throws {400} Invalid input (missing sessionCode)
 * @throws {404} Session not found
 * @throws {500} Database error
 */
export const getActionsEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionCode } = req.params;

    if (!sessionCode) {
      res.status(400).json({ error: 'sessionCode is required' });
      return;
    }

    const result = await getActions(sessionCode);

    res.json({
      actions: result.actions,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Session not found') {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    console.error('Error fetching actionIDs and start times from database: ', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
};

/**
 * Updates the size and/or color of a specific action in a session.
 * Primarily used by host response modes (colorShift, sizePulse) to provide
 * visual feedback on participant submissions.
 * 
 * @async
 * @function updateActionIcon
 * @param {Request} req - Express request object
 * @param {string} req.params.sessionCode - Session code (required)
 * @param {string|number} req.params.actionID - Numeric action ID (required)
 * @param {number} req.body.size - New size value (required, must be positive)
 * @param {string} [req.body.color] - New color value in hex format (optional, e.g., '#FF5733')
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * 
 * @example
 * // Request - Update size only
 * PATCH /api/session/XyZ9aB/action/1
 * {
 *   "size": 72
 * }
 * 
 * // Request - Update size and color
 * PATCH /api/session/XyZ9aB/action/1
 * {
 *   "size": 72,
 *   "color": "#FF5733"
 * }
 * 
 * // Response (200 OK)
 * {
 *   "message": "Action updated",
 *   "action": {
 *     "id": "550e8400-e29b-41d4-a716-446655440000",
 *     "actionID": 1,
 *     "type": "question",
 *     "content": "What is TypeScript?",
 *     "start_time": "2025-12-08T10:31:00.000Z",
 *     "size": 72,
 *     "color": "#FF5733"
 *   }
 * }
 * 
 * @throws {400} Invalid input (missing/invalid sessionCode, actionID, or size)
 * @throws {404} Session not found or action not found
 * @throws {500} Database error
 */
export const updateActionIcon = async (req: Request, res: Response): Promise<void> => {
  // Extract variables early so they're available in catch block
  const { sessionCode, actionID } = req.params;
  const { size, color } = req.body;

  try {
    if (!sessionCode) {
      res.status(400).json({ error: 'sessionCode is required' });
      return;
    }

    if (!actionID) {
      res.status(400).json({ error: 'actionID is required' });
      return;
    }

    // Parse actionID to integer
    const numericActionID = parseInt(actionID, 10);
    if (isNaN(numericActionID)) {
      res.status(400).json({ error: 'actionID must be a valid number' });
      return;
    }

    // Validate size
    if (size === undefined || size === null) {
      res.status(400).json({ error: 'size is required' });
      return;
    }

    const numericSize = typeof size === 'string' ? parseFloat(size) : Number(size);
    if (isNaN(numericSize) || numericSize < 0) {
      res.status(400).json({ error: 'size must be a positive number' });
      return;
    }

    // Find the session
    const session = await Session.findOne({ sessionCode });
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Find the action
    if (!session.actions || !Array.isArray(session.actions)) {
      res.status(404).json({ error: 'Action not found' });
      return;
    }

    const actionIndex = session.actions.findIndex((a: any) => a.actionID === numericActionID);
    if (actionIndex === -1) {
      res.status(404).json({ error: 'Action not found' });
      return;
    }

    // Update the action
    const action = session.actions[actionIndex] as any;
    const updatedAction = {
      ...action,
      size: numericSize,
      ...(color !== undefined && color !== null ? { color } : {}),
    };

    // Reassign the entire array to ensure Mongoose detects the change
    session.actions = [
      ...session.actions.slice(0, actionIndex),
      updatedAction,
      ...session.actions.slice(actionIndex + 1),
    ];
    session.markModified('actions');
    await session.save();

    console.log('Action icon updated:', { sessionCode, actionID: numericActionID, size: numericSize, color });

    res.status(200).json({
      message: 'Action updated',
      action: updatedAction,
    });
  } catch (error) {
    console.error('Error updating action icon:', error instanceof Error ? error.message : String(error), {
      sessionCode: sessionCode || 'unknown',
      actionID: actionID || 'unknown',
      size: size || 'unknown',
    });
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

