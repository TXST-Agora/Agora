import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  generateSessionCode, 
  createSession,
  getTimePassed,
  formatTimePassed,
  createActionTimeMarginDictionary,
  getActionContent,
  getActionsWithTimes,
  updateAllActionTimeMargins
} from '../../services/sessionService.js';

// Mock the database connection and schema
vi.mock('../../../db/connection.js', () => ({}));

// Use vi.hoisted() to create mocks that can be used in both the mock factory and tests
const { mockFindOne, mockFind, mockSave, mockMarkModified, MockSession } = vi.hoisted(() => {
  const mockFindOne = vi.fn();
  const mockFind = vi.fn();
  const mockSave = vi.fn();
  const mockMarkModified = vi.fn();
  
  // Create a class that can be used as a constructor
  class MockSession {
    public _id = 'mock-session-id';
    public sessionID: string;
    public sessionCode?: string;
    public title: string;
    public description: string;
    public sessionType: string;
    public startTime: Date;
    public hostStartTime?: Date;
    public hostEndTime?: Date | null;
    public actions?: Array<any>;
    
    constructor(data: any) {
      this.sessionID = data.sessionID;
      this.sessionCode = data.sessionCode;
      this.title = data.title;
      this.description = data.description;
      this.sessionType = data.sessionType;
      this.startTime = data.startTime;
      this.hostStartTime = data.hostStartTime;
      this.hostEndTime = data.hostEndTime;
      this.actions = data.actions;
    }
    
    markModified(field: string) {
      mockMarkModified(field);
    }
    
    save() {
      return mockSave();
    }
    
    static findOne: ReturnType<typeof vi.fn> = mockFindOne;
    static find: ReturnType<typeof vi.fn> = mockFind;
  }
  
  return { mockFindOne, mockFind, mockSave, mockMarkModified, MockSession };
});

vi.mock('../../../db/session-schema.js', () => ({
  default: MockSession,
}));

describe('sessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSave.mockResolvedValue(undefined);
    mockMarkModified.mockImplementation(() => {});
  });

  describe('generateSessionCode', () => {
    it('should generate a code of the specified length', () => {
      const code = generateSessionCode(6);
      expect(code).toHaveLength(6);
    });

    it('should generate a code of default length (6) when no length specified', () => {
      const code = generateSessionCode();
      expect(code).toHaveLength(6);
    });

    it('should generate codes of different lengths', () => {
      const code4 = generateSessionCode(4);
      const code8 = generateSessionCode(8);
      expect(code4).toHaveLength(4);
      expect(code8).toHaveLength(8);
    });

    it('should only use characters from the allowed alphabet', () => {
      const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const code = generateSessionCode(20); // Longer code for better coverage
      
      for (const char of code) {
        expect(alphabet).toContain(char);
      }
    });

    it('should not include confusing characters (0, O, I, 1)', () => {
      const forbiddenChars = ['0', 'O', 'I', '1'];
      const code = generateSessionCode(50); // Longer code to increase chance of hitting forbidden chars
      
      for (const char of forbiddenChars) {
        expect(code).not.toContain(char);
      }
    });

    it('should generate different codes on multiple calls', () => {
      const codes = new Set();
      for (let i = 0; i < 10; i++) {
        codes.add(generateSessionCode(6));
      }
      // Very unlikely all 10 codes are the same
      expect(codes.size).toBeGreaterThan(1);
    });
  });

  describe('createSession', () => {

    it('should create a session with a unique code', async () => {
      mockFindOne.mockResolvedValue(null); // No existing session
      
      const options = {
        title: 'Test Session',
        description: 'Test Description',
        sessionType: 'normal',
        length: 6,
      };

      const session = await createSession(options);

      expect(mockFindOne).toHaveBeenCalled();
      expect(mockSave).toHaveBeenCalled();
      expect(session.title).toBe(options.title);
      expect(session.description).toBe(options.description);
      expect(session.sessionType).toBe(options.sessionType);
      expect(session.sessionID).toBeDefined();
      expect(session.sessionID).toHaveLength(6);
    });

    it('should retry if generated code already exists', async () => {
      // First call returns existing session, second returns null (unique)
      mockFindOne
        .mockResolvedValueOnce({ sessionID: 'EXISTING' }) // First attempt: code exists
        .mockResolvedValueOnce(null); // Second attempt: code is unique

      const options = {
        title: 'Test Session',
        sessionType: 'normal',
      };

      const session = await createSession(options);

      expect(mockFindOne).toHaveBeenCalledTimes(2);
      expect(mockSave).toHaveBeenCalled();
      expect(session.sessionID).toBeDefined();
    });

    it('should throw error if unable to generate unique code after max attempts', async () => {
      mockFindOne.mockResolvedValue({ sessionID: 'EXISTS' }); // Always returns existing

      const options = {
        title: 'Test Session',
        sessionType: 'normal',
      };

      await expect(createSession(options)).rejects.toThrow(
        'Failed to generate unique session code after multiple attempts'
      );
      
      expect(mockFindOne).toHaveBeenCalledTimes(10); // maxAttempts
    });

    it('should use default length of 6 if not specified', async () => {
      mockFindOne.mockResolvedValue(null);

      const options = {
        title: 'Test Session',
        sessionType: 'normal',
      };

      const session = await createSession(options);

      expect(session.sessionID).toHaveLength(6);
    });

    it('should use empty string for description if not provided', async () => {
      mockFindOne.mockResolvedValue(null);

      const options = {
        title: 'Test Session',
        sessionType: 'normal',
      };

      const session = await createSession(options);

      expect(session.description).toBe('');
    });

    it('should set startTime when creating session', async () => {
      mockFindOne.mockResolvedValue(null);

      const options = {
        title: 'Test Session',
        sessionType: 'normal',
      };

      const session = await createSession(options);

      expect(session.startTime).toBeDefined();
      expect(session.startTime).toBeInstanceOf(Date);
    });
  });

  describe('getTimePassed', () => {
    it('should return null for null input', () => {
      expect(getTimePassed(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(getTimePassed(undefined)).toBeNull();
    });

    it('should calculate time passed correctly with Date object', () => {
      const pastDate = new Date(Date.now() - 5000); // 5 seconds ago
      const result = getTimePassed(pastDate);
      
      expect(result).toBeGreaterThan(4.9); // Allow some margin for test execution time
      expect(result).toBeLessThan(5.1);
      expect(typeof result).toBe('number');
    });

    it('should calculate time passed correctly with ISO string', () => {
      const pastDate = new Date(Date.now() - 3000); // 3 seconds ago
      const isoString = pastDate.toISOString();
      const result = getTimePassed(isoString);
      
      expect(result).toBeGreaterThan(2.9);
      expect(result).toBeLessThan(3.1);
    });

    it('should return decimal seconds, not milliseconds', () => {
      const pastDate = new Date(Date.now() - 2500); // 2.5 seconds ago
      const result = getTimePassed(pastDate);
      
      // Should be around 2.5, not 2500
      expect(result).toBeGreaterThan(2.4);
      expect(result).toBeLessThan(2.6);
      expect(result).toBeLessThan(100); // Definitely not in milliseconds range
    });

    it('should return null for invalid date string', () => {
      expect(getTimePassed('invalid-date-string')).toBeNull();
    });

    it('should handle future dates (negative result)', () => {
      const futureDate = new Date(Date.now() + 2000); // 2 seconds in future
      const result = getTimePassed(futureDate);
      
      expect(result).toBeLessThan(0);
      expect(result).toBeGreaterThan(-2.1);
    });
  });

  describe('formatTimePassed', () => {
    it('should return null for null input', () => {
      expect(formatTimePassed(null)).toBeNull();
    });

    it('should format seconds correctly', () => {
      expect(formatTimePassed(0)).toBe('0 seconds ago');
      expect(formatTimePassed(1)).toBe('1 second ago');
      expect(formatTimePassed(5)).toBe('5 seconds ago');
      expect(formatTimePassed(59)).toBe('59 seconds ago');
    });

    it('should format minutes correctly', () => {
      expect(formatTimePassed(60)).toBe('1 minute ago');
      expect(formatTimePassed(120)).toBe('2 minutes ago');
      expect(formatTimePassed(3599)).toBe('59 minutes ago');
    });

    it('should format hours correctly', () => {
      expect(formatTimePassed(3600)).toBe('1 hour ago');
      expect(formatTimePassed(7200)).toBe('2 hours ago');
      expect(formatTimePassed(86399)).toBe('23 hours ago');
    });

    it('should format days correctly', () => {
      expect(formatTimePassed(86400)).toBe('1 day ago');
      expect(formatTimePassed(172800)).toBe('2 days ago');
      expect(formatTimePassed(259200)).toBe('3 days ago');
    });

    it('should handle decimal seconds by flooring', () => {
      expect(formatTimePassed(1.9)).toBe('1 second ago');
      expect(formatTimePassed(65.7)).toBe('1 minute ago');
    });
  });

  describe('createActionTimeMarginDictionary', () => {
    it('should return empty object for null input', () => {
      expect(createActionTimeMarginDictionary(null)).toEqual({});
    });

    it('should return empty object for undefined input', () => {
      expect(createActionTimeMarginDictionary(undefined)).toEqual({});
    });

    it('should return empty object for empty array', () => {
      expect(createActionTimeMarginDictionary([])).toEqual({});
    });

    it('should create dictionary with actionID and time passed in seconds', () => {
      const now = Date.now();
      const actions = [
        {
          actionID: 1,
          start_time: new Date(now - 5000), // 5 seconds ago
          content: 'test'
        },
        {
          actionID: 2,
          start_time: new Date(now - 10000), // 10 seconds ago
          content: 'test2'
        }
      ];

      const result = createActionTimeMarginDictionary(actions);

      expect(result).toHaveProperty('1');
      expect(result).toHaveProperty('2');
      expect(result[1]).toBeGreaterThan(4.9);
      expect(result[1]).toBeLessThan(5.1);
      expect(result[2]).toBeGreaterThan(9.9);
      expect(result[2]).toBeLessThan(10.1);
    });

    it('should handle ISO string dates', () => {
      const now = Date.now();
      const actions = [
        {
          actionID: 1,
          start_time: new Date(now - 2000).toISOString(), // 2 seconds ago
          content: 'test'
        }
      ];

      const result = createActionTimeMarginDictionary(actions);

      expect(result[1]).toBeGreaterThan(1.9);
      expect(result[1]).toBeLessThan(2.1);
    });

    it('should skip actions without actionID', () => {
      const now = Date.now();
      const actions: any[] = [
        {
          actionID: 1,
          start_time: new Date(now - 1000),
          content: 'test'
        },
        {
          start_time: new Date(now - 2000), // No actionID
          content: 'test2'
        },
        {
          actionID: null,
          start_time: new Date(now - 3000), // null actionID
          content: 'test3'
        }
      ];

      const result = createActionTimeMarginDictionary(actions);

      expect(Object.keys(result)).toHaveLength(1);
      expect(result).toHaveProperty('1');
    });

    it('should skip actions without start_time', () => {
      const actions = [
        {
          actionID: 1,
          start_time: new Date(Date.now() - 1000),
          content: 'test'
        },
        {
          actionID: 2, // No start_time
          content: 'test2'
        }
      ];

      const result = createActionTimeMarginDictionary(actions);

      expect(Object.keys(result)).toHaveLength(1);
      expect(result).toHaveProperty('1');
      expect(result).not.toHaveProperty('2');
    });
  });

  describe('getActionContent', () => {
    it('should return action content when session and action exist', async () => {
      const mockSession = {
        sessionCode: 'ABC123',
        actions: [
          { actionID: 1, content: 'Test question', type: 'question', start_time: new Date() },
          { actionID: 2, content: 'Test comment', type: 'comment', start_time: new Date() }
        ]
      };

      mockFindOne.mockResolvedValue(mockSession);

      const content = await getActionContent('ABC123', 1);

      expect(mockFindOne).toHaveBeenCalledWith({
        $or: [
          { sessionCode: 'ABC123' },
          { sessionID: 'ABC123' }
        ]
      });
      expect(content).toBe('Test question');
    });

    it('should find session by sessionID if sessionCode not found', async () => {
      const mockSession = {
        sessionID: 'XYZ789',
        sessionCode: undefined,
        actions: [
          { actionID: 1, content: 'Found by ID', type: 'question', start_time: new Date() }
        ]
      };

      mockFindOne.mockResolvedValue(mockSession);

      const content = await getActionContent('XYZ789', 1);

      expect(content).toBe('Found by ID');
    });

    it('should throw error when session not found', async () => {
      mockFindOne.mockResolvedValue(null);

      await expect(getActionContent('NONEXISTENT', 1)).rejects.toThrow('Session not found');
    });

    it('should throw error when action not found', async () => {
      const mockSession = {
        sessionCode: 'ABC123',
        actions: [
          { actionID: 1, content: 'Test', type: 'question', start_time: new Date() }
        ]
      };

      mockFindOne.mockResolvedValue(mockSession);

      await expect(getActionContent('ABC123', 999)).rejects.toThrow('Action not found');
    });

    it('should return null when action has no content', async () => {
      const mockSession = {
        sessionCode: 'ABC123',
        actions: [
          { actionID: 1, content: null, type: 'question', start_time: new Date() }
        ]
      };

      mockFindOne.mockResolvedValue(mockSession);

      const content = await getActionContent('ABC123', 1);

      expect(content).toBeNull();
    });

    it('should handle empty actions array', async () => {
      const mockSession = {
        sessionCode: 'ABC123',
        actions: []
      };

      mockFindOne.mockResolvedValue(mockSession);

      await expect(getActionContent('ABC123', 1)).rejects.toThrow('Action not found');
    });
  });

  describe('getActionsWithTimes', () => {
    it('should return actions with timeMargin, size, and color', async () => {
      const mockSession = {
        sessionCode: 'ABC123',
        actions: [
          { 
            actionID: 1, 
            content: 'Question 1', 
            type: 'question', 
            start_time: new Date(),
            timeMargin: 5.5,
            size: 48,
            color: '#16a34a'
          },
          { 
            actionID: 2, 
            content: 'Comment 1', 
            type: 'comment', 
            start_time: new Date(),
            timeMargin: 10.2,
            size: 48,
            color: '#16a34a'
          }
        ]
      };

      mockFindOne.mockResolvedValue(mockSession);

      const result = await getActionsWithTimes('ABC123');

      expect(mockFindOne).toHaveBeenCalledWith({
        $or: [
          { sessionCode: 'ABC123' },
          { sessionID: 'ABC123' }
        ]
      });

      expect(result.actions).toHaveLength(2);
      expect(result.actions[0]?.actionID).toBe(1);
      expect(result.actions[0]?.timeMargin).toBe(5.5);
      expect(result.actions[0]?.size).toBe(48);
      expect(result.actions[0]?.color).toBe('#16a34a');
      expect(result.actions[1]?.actionID).toBe(2);
      expect(result.actions[1]?.timeMargin).toBe(10.2);
    });

    it('should find session by sessionID if sessionCode not found', async () => {
      const mockSession = {
        sessionID: 'XYZ789',
        sessionCode: undefined,
        actions: [
          { actionID: 1, content: 'Test', type: 'question', start_time: new Date() }
        ]
      };

      mockFindOne.mockResolvedValue(mockSession);

      const result = await getActionsWithTimes('XYZ789');

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0]?.actionID).toBe(1);
    });

    it('should throw error when session not found', async () => {
      mockFindOne.mockResolvedValue(null);

      await expect(getActionsWithTimes('NONEXISTENT')).rejects.toThrow('Session not found');
    });

    it('should handle empty actions array', async () => {
      const mockSession = {
        sessionCode: 'ABC123',
        actions: []
      };

      mockFindOne.mockResolvedValue(mockSession);

      const result = await getActionsWithTimes('ABC123');

      expect(result.actions).toHaveLength(0);
    });

    it('should skip actions without actionID', async () => {
      const mockSession = {
        sessionCode: 'ABC123',
        actions: [
          { actionID: 1, content: 'Test', type: 'question', start_time: new Date() },
          { content: 'No ID', type: 'comment', start_time: new Date() },
          { actionID: null, content: 'Null ID', type: 'comment', start_time: new Date() }
        ]
      };

      mockFindOne.mockResolvedValue(mockSession);

      const result = await getActionsWithTimes('ABC123');

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0]?.actionID).toBe(1);
    });

    it('should handle actions with null timeMargin', async () => {
      const mockSession = {
        sessionCode: 'ABC123',
        actions: [
          { 
            actionID: 1, 
            content: 'Test', 
            type: 'question', 
            start_time: new Date(),
            timeMargin: null
          }
        ]
      };

      mockFindOne.mockResolvedValue(mockSession);

      const result = await getActionsWithTimes('ABC123');

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0]?.timeMargin).toBeNull();
    });

    it('should handle actions without timeMargin property', async () => {
      const mockSession = {
        sessionCode: 'ABC123',
        actions: [
          { 
            actionID: 1, 
            content: 'Test', 
            type: 'question', 
            start_time: new Date()
          }
        ]
      };

      mockFindOne.mockResolvedValue(mockSession);

      const result = await getActionsWithTimes('ABC123');

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0]?.timeMargin).toBeNull();
    });
  });

  describe('updateAllActionTimeMargins', () => {
    it('should update timeMargin for all actions in active sessions', async () => {
      const now = Date.now();
      const action1StartTime = new Date(now - 5000); // 5 seconds ago
      const action2StartTime = new Date(now - 10000); // 10 seconds ago

      const mockSession1 = new MockSession({
        sessionCode: 'ABC123',
        hostEndTime: null,
        actions: [
          {
            actionID: 1,
            content: 'Question 1',
            type: 'question',
            start_time: action1StartTime,
            timeMargin: null
          },
          {
            actionID: 2,
            content: 'Comment 1',
            type: 'comment',
            start_time: action2StartTime,
            timeMargin: null
          }
        ]
      });

      mockFind.mockResolvedValue([mockSession1]);

      await updateAllActionTimeMargins();

      expect(mockFind).toHaveBeenCalledWith({
        actions: { $exists: true, $ne: [] },
        $or: [
          { hostEndTime: { $exists: false } },
          { hostEndTime: null }
        ]
      });

      expect(mockMarkModified).toHaveBeenCalledWith('actions');
      expect(mockSave).toHaveBeenCalledTimes(1);

      // Verify timeMargin was calculated (approximately 5 and 10 seconds)
      const updatedActions = mockSession1.actions;
      expect(updatedActions).toBeDefined();
      expect(updatedActions?.[0]?.timeMargin).toBeGreaterThan(4.9);
      expect(updatedActions?.[0]?.timeMargin).toBeLessThan(5.1);
      expect(updatedActions?.[1]?.timeMargin).toBeGreaterThan(9.9);
      expect(updatedActions?.[1]?.timeMargin).toBeLessThan(10.1);
    });

    it('should skip sessions with hostEndTime set', async () => {
      const mockSession = new MockSession({
        sessionCode: 'ENDED123',
        hostEndTime: new Date(),
        actions: [
          {
            actionID: 1,
            content: 'Question',
            type: 'question',
            start_time: new Date()
          }
        ]
      });

      mockFind.mockResolvedValue([]);

      await updateAllActionTimeMargins();

      expect(mockSave).not.toHaveBeenCalled();
    });

    it('should skip sessions without actions', async () => {
      const mockSession = new MockSession({
        sessionCode: 'NOACTIONS',
        hostEndTime: null,
        actions: []
      });

      mockFind.mockResolvedValue([mockSession]);

      await updateAllActionTimeMargins();

      expect(mockSave).not.toHaveBeenCalled();
    });

    it('should handle actions without start_time', async () => {
      const mockSession = new MockSession({
        sessionCode: 'ABC123',
        hostEndTime: null,
        actions: [
          {
            actionID: 1,
            content: 'Question',
            type: 'question',
            start_time: null
          }
        ]
      });

      mockFind.mockResolvedValue([mockSession]);

      await updateAllActionTimeMargins();

      expect(mockMarkModified).toHaveBeenCalledWith('actions');
      expect(mockSave).toHaveBeenCalled();
      expect(mockSession.actions?.[0]?.timeMargin).toBeNull();
    });

    it('should handle empty sessions array', async () => {
      mockFind.mockResolvedValue([]);

      await updateAllActionTimeMargins();

      expect(mockSave).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockFind.mockRejectedValue(new Error('Database error'));

      await expect(updateAllActionTimeMargins()).rejects.toThrow('Database error');
    });
  });
});
