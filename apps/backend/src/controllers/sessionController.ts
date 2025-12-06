import { type Request, type Response } from 'express';
import { randomUUID } from 'crypto';
import { createSession, createSessionWithMode, getActionContent, getActions } from '../services/sessionService.js';
import '../../db/connection.js';
// @ts-ignore - JS file without type definitions
import Session from '../../db/session-schema.js';

/**
 * Controller for session-related HTTP endpoints
 */

/**
 * POST /api/v1/session/code
 * Generates a new randomized alphanumeric session code and saves it to the database
 * Request body should contain: { title: string, description?: string, sessionType: string }
 */

const MIN_TITLE_LENGTH = 3;
const MAX_DESCRIPTION_LENGTH = 200;
const VALID_SESSION_TYPES = ['normal', 'colorShift', 'sizePulse'] as const;
const VALID_MODES = ['normal', 'colorShift', 'sizePulse'] as const;

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
 * POST /api/session/create
 * Creates a new session with mode field and saves it to the database
 * Request body should contain: { title: string, description?: string, mode: string }
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
 * GET /api/session/:sessionCode
 * Retrieves a session by sessionCode
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
 * POST /api/session/:sessionCode/action
 * Adds a new action (question/comment) to a session
 * Request body should contain: { type: string, content: string }
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
 * GET /api/session/:sessionCode/:actionID
 * Gets the content of a specific action by sessionCode and actionID
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
 * GET /api/session/:sessionCode/actions/times
 * Gets all actionIDs with their timeMargin, size, and color for a specific session
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

