import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateSessionCode, createSession } from '../services/sessionService.js';

// Mock the database connection and schema
vi.mock('../../db/connection.js', () => ({}));

// Use vi.hoisted() to create mocks that can be used in both the mock factory and tests
const { mockFindOne, mockSave, MockSession } = vi.hoisted(() => {
  const mockFindOne = vi.fn();
  const mockSave = vi.fn();
  
  // Create a class that can be used as a constructor
  class MockSession {
    public _id = 'mock-session-id';
    public sessionID: string;
    public title: string;
    public description: string;
    public sessionType: string;
    public startTime: Date;
    
    constructor(data: any) {
      this.sessionID = data.sessionID;
      this.title = data.title;
      this.description = data.description;
      this.sessionType = data.sessionType;
      this.startTime = data.startTime;
    }
    
    save() {
      return mockSave();
    }
    
    static findOne: ReturnType<typeof vi.fn> = mockFindOne;
  }
  
  return { mockFindOne, mockSave, MockSession };
});

vi.mock('../../db/session-schema.js', () => ({
  default: MockSession,
}));

describe('sessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSave.mockResolvedValue(undefined);
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
});
