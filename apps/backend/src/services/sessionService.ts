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

/**
 * Creates a new session with the new endpoint structure
 * @param options - Session creation options
 * @param options.title - The session title
 * @param options.description - The session description (optional)
 * @param options.mode - The session mode (e.g., 'normal', 'colorShift', 'sizePulse')
 * @returns The created session document
 */
export const createSessionWithMode = async (options: {
  title: string;
  description?: string;
  mode: string;
}) => {
  const { title, description, mode } = options;

  // Generate a unique code
  let code: string = '';
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  // Ensure code is unique (check both sessionID and sessionCode fields)
  while (!isUnique && attempts < maxAttempts) {
    code = generateSessionCode(6);
    const existingSession = await Session.findOne({ 
      $or: [{ sessionID: code }, { sessionCode: code }] 
    });
    if (!existingSession) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique session code after multiple attempts');
  }

  // Create and save the session with new field structure
  const session = new Session({
    sessionCode: code,
    title,
    description: description || '',
    mode,
    hostStartTime: new Date(),
    actions: [],
  });

  await session.save();
  return session;
};

/**
 * Calculates the time passed since a given start time
 * @param startTime - The start time (Date object or ISO string)
 * @returns Time passed in decimal seconds, or null if invalid
 */
export const getTimePassed = (startTime: Date | string | null | undefined): number | null => {
  if (!startTime) {
    return null;
  }

  // Accept either Date objects or ISO strings from MongoDB
  const startDate = startTime instanceof Date ? startTime : new Date(startTime);

  if (isNaN(startDate.getTime())) {
    return null;
  }

  const now = new Date();
  const milliseconds = now.getTime() - startDate.getTime();
  // Convert milliseconds to decimal seconds (divide by 1000)
  const seconds = milliseconds / 1000;
  return seconds;
};

/**
 * Formats the time passed since the start time to be human readable
 * @param seconds - Time in decimal seconds
 * @returns Formatted string like "2 days ago", "3 hours ago", or null if invalid
 */
export const formatTimePassed = (seconds: number | null): string | null => {
  if (seconds == null) return null;

  const wholeSeconds = Math.floor(seconds);
  const minutes = Math.floor(wholeSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else {
    return `${wholeSeconds} second${wholeSeconds !== 1 ? 's' : ''} ago`;
  }
};

interface Action {
  actionID?: number;
  start_time?: Date | string;
  content?: string;
  [key: string]: unknown;
}

/**
 * Creates a dictionary of actionID to time passed (margin)
 * @param actions - Array of actions with actionID and start_time
 * @returns Object where key is actionID and value is time passed in decimal seconds
 */
export const createActionTimeMarginDictionary = (actions: Action[] | undefined | null): Record<number, number> => {
  const timeMarginDict: Record<number, number> = {};
  
  if (Array.isArray(actions)) {
    actions.forEach(action => {
      if (action.actionID !== undefined && action.actionID !== null && action.start_time) {
        const timePassed = getTimePassed(action.start_time);
        if (timePassed !== null) {
          timeMarginDict[action.actionID] = timePassed; // time passed in decimal seconds
        }
      }
    });
  }
  
  return timeMarginDict;
};

/**
 * Gets the content of a specific action by sessionCode and actionID
 * @param sessionCode - The session code or sessionID
 * @param actionID - The action ID
 * @returns The action content, or null if not found
 * @throws Error if session not found
 */
export const getActionContent = async (sessionCode: string, actionID: number): Promise<string | null> => {
  // Find session by sessionCode or sessionID
  const session = await Session.findOne({
    $or: [
      { sessionCode: sessionCode },
      { sessionID: sessionCode }
    ]
  });

  if (!session) {
    throw new Error('Session not found');
  }

  // Find the action with matching actionID
  let foundAction: Action | null = null;
  if (Array.isArray(session.actions)) {
    foundAction = session.actions.find((action: Action) => action.actionID === actionID) || null;
  }

  if (!foundAction) {
    throw new Error('Action not found');
  }

  return foundAction.content || null;
};

/**
 * Gets all actionIDs and their start_time for a specific session, along with time margins
 * @param sessionCode - The session code or sessionID
 * @returns Object containing actions array and timeMargins dictionary
 * @throws Error if session not found
 */
export const getActionsWithTimes = async (sessionCode: string): Promise<{
  actions: Array<{ actionID: number; start_time: Date | string }>;
  timeMargins: Record<number, number>;
}> => {
  // Find session by sessionCode or sessionID
  const session = await Session.findOne({
    $or: [
      { sessionCode: sessionCode },
      { sessionID: sessionCode }
    ]
  });

  if (!session) {
    throw new Error('Session not found');
  }

  // Extract actionID and start_time for each action
  const actions: Array<{ actionID: number; start_time: Date | string }> = [];
  if (Array.isArray(session.actions)) {
    session.actions.forEach((action: Action) => {
      if (action.actionID !== undefined && action.actionID !== null) {
        actions.push({
          actionID: action.actionID,
          start_time: action.start_time || new Date(),
        });
      }
    });
  }

  // Create dictionary with actionID as key and time passed (margin) as value
  const timeMargins = createActionTimeMarginDictionary(session.actions);

  return {
    actions,
    timeMargins,
  };
};

