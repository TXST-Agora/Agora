import { type Request, type Response } from 'express';
//import { createSession } from '../services/sessionService.js';
import { createSession, getSessionsWithTime } from '../services/sessionService.js';

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

export const listSessionsWithTime = async (_req: Request, res: Response): Promise<void> => {
  try {
    const sessions = await getSessionsWithTime();
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch sessions',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};