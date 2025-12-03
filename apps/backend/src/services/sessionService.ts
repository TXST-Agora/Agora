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


//Helper function to get the time passed since the start time
function getTimePassed(startTime: Date | string | undefined | null): number | null {
  if (!startTime) return null;

  const startDate = startTime instanceof Date ? startTime : new Date(startTime);
  if (isNaN(startDate.getTime())) return null;

  const now = new Date();
  return now.getTime() - startDate.getTime(); // ms
}

//Helper function to format the time passed since the start time to be human readable
function formatTimePassed(ms: number | null): string | null {
  if (ms == null) return null;

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else {
    return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  }
}

// Fetch sessions and attach time fields, based on your MongoDB structure
export const getSessionsWithTime = async () => {
  const sessions = await Session.find({});

  return sessions.map((session: any) => {
    const sessionObj = session.toObject();

    const hostMs  = getTimePassed(sessionObj.hostStartTime);
    sessionObj.hostTimePassedMs  = hostMs;
    sessionObj.hostTimePassedStr = formatTimePassed(hostMs);

    if (Array.isArray(sessionObj.actions)) {
      sessionObj.actions = sessionObj.actions.map((action: any) => {
        const actionMs = getTimePassed(action.start_time);
        return {
          ...action,
          timePassedMs: actionMs,
          timePassedStr: formatTimePassed(actionMs),
        };
      });
    }

    return sessionObj;
  });
};
