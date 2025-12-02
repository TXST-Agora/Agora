import '../../db/connection.js';
// @ts-ignore - JS file without type definitions
import Session from '../../db/session-schema.js';

/**
 * Service for session-related business logic
 */

/**
 * Generates a randomized alphanumeric session code.
 * Excludes confusing characters (0, O, I, 1) for better readability.
 * @param length - The length of the code to generate (default: 6)
 * @returns A randomized alphanumeric string
 */
export const generateSessionCode = (length: number = 6): string => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing chars
  let code = "";
  for (let i = 0; i < length; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
};

/**
 * Creates a new session with a generated code and saves it to the database
 * @param options - Session creation options
 * @param options.length - The length of the code to generate (default: 6)
 * @param options.title - The session title
 * @param options.description - The session description (optional)
 * @param options.sessionType - The session type/mode (e.g., 'normal', 'colorShift', 'sizePulse')
 * @returns The created session document
 */
export const createSession = async (options: {
  length?: number;
  title: string;
  description?: string;
  sessionType: string;
}) => {
  const { length = 6, title, description, sessionType } = options;

  // Generate a unique code
  let code: string = '';
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  // Ensure code is unique
  while (!isUnique && attempts < maxAttempts) {
    code = generateSessionCode(length);
    const existingSession = await Session.findOne({ sessionID: code });
    if (!existingSession) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique session code after multiple attempts');
  }

  // Create and save the session
  const session = new Session({
    sessionID: code,
    title,
    description: description || '',
    sessionType,
    startTime: new Date(),
  });

  await session.save();
  return session;
};

