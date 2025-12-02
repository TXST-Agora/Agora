import { type Request, type Response } from 'express';
import { createSession } from '../services/sessionService.js';

/**
 * Controller for session-related HTTP endpoints
 */

/**
 * POST /api/v1/session/code
 * Generates a new randomized alphanumeric session code and saves it to the database
 */
export const createSessionCode = async (_req: Request, res: Response): Promise<void> => {
  try {
    const session = await createSession(6);
    res.status(201).json({ 
      code: session.sessionID,
      id: session._id,
      createdAt: session.createdAt 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to generate session code', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};

