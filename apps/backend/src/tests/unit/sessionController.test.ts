import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type Request, type Response } from 'express';
import { createSessionCode, getActionContentEndpoint, getActionsWithTimesEndpoint } from '../../controllers/sessionController.js';
import * as sessionService from '../../services/sessionService.js';

// Mock the session service
vi.mock('../../services/sessionService.js', () => ({
  createSession: vi.fn(),
  getActionContent: vi.fn(),
  getActionsWithTimes: vi.fn(),
}));

describe('sessionController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockJson = vi.fn().mockReturnThis();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson } as any);
    
    mockRequest = {
      body: {},
      params: {},
    };
    
    mockResponse = {
      status: mockStatus as any,
      json: mockJson as any,
    };
  });

  describe('createSessionCode', () => {
    it('should create a session with valid data', async () => {
      const mockSession = {
        sessionID: 'ABC123',
        _id: 'session-id-123',
        title: 'Test Session',
        description: 'Test Description',
        sessionType: 'normal',
      };

      vi.mocked(sessionService.createSession).mockResolvedValue(mockSession as any);

      mockRequest.body = {
        title: 'Test Session',
        description: 'Test Description',
        sessionType: 'normal',
      };

      await createSessionCode(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        code: 'ABC123',
        id: 'session-id-123',
        title: 'Test Session',
        description: 'Test Description',
        sessionType: 'normal',
      });
      expect(sessionService.createSession).toHaveBeenCalledWith({
        title: 'Test Session',
        description: 'Test Description',
        sessionType: 'normal',
        length: 6,
      });
    });

    it('should return 400 if title is missing', async () => {
      mockRequest.body = {
        sessionType: 'normal',
      };

      await createSessionCode(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Title is required and must be a string',
      });
      expect(sessionService.createSession).not.toHaveBeenCalled();
    });

    it('should return 400 if title is not a string', async () => {
      mockRequest.body = {
        title: 123,
        sessionType: 'normal',
      };

      await createSessionCode(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Title is required and must be a string',
      });
    });

    it('should return 400 if title is empty after trimming', async () => {
      mockRequest.body = {
        title: '   ',
        sessionType: 'normal',
      };

      await createSessionCode(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Title cannot be empty',
      });
    });

    it('should return 400 if title is too short', async () => {
      mockRequest.body = {
        title: 'AB',
        sessionType: 'normal',
      };

      await createSessionCode(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Title must be at least 3 characters',
      });
    });

    it('should trim title before validation', async () => {
      const mockSession = {
        sessionID: 'ABC123',
        _id: 'session-id-123',
        title: 'Valid Title',
        description: '',
        sessionType: 'normal',
      };

      vi.mocked(sessionService.createSession).mockResolvedValue(mockSession as any);

      mockRequest.body = {
        title: '  Valid Title  ',
        sessionType: 'normal',
      };

      await createSessionCode(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(sessionService.createSession).toHaveBeenCalledWith({
        title: 'Valid Title',
        description: '',
        sessionType: 'normal',
        length: 6,
      });
    });

    it('should return 400 if sessionType is missing', async () => {
      mockRequest.body = {
        title: 'Valid Title',
      };

      await createSessionCode(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Session type is required and must be a string',
      });
    });

    it('should return 400 if sessionType is invalid', async () => {
      mockRequest.body = {
        title: 'Valid Title',
        sessionType: 'invalidType',
      };

      await createSessionCode(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Session type must be one of: normal, colorShift, sizePulse',
      });
    });

    it('should accept valid session types', async () => {
      const validTypes = ['normal', 'colorShift', 'sizePulse'];
      
      for (const sessionType of validTypes) {
        vi.clearAllMocks();
        const mockSession = {
          sessionID: 'ABC123',
          _id: 'session-id-123',
          title: 'Test Session',
          description: '',
          sessionType,
        };

        vi.mocked(sessionService.createSession).mockResolvedValue(mockSession as any);

        mockRequest.body = {
          title: 'Test Session',
          sessionType,
        };

        await createSessionCode(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(mockStatus).toHaveBeenCalledWith(201);
        expect(sessionService.createSession).toHaveBeenCalledWith({
          title: 'Test Session',
          description: '',
          sessionType,
          length: 6,
        });
      }
    });

    it('should return 400 if description exceeds max length', async () => {
      const longDescription = 'a'.repeat(201);
      
      mockRequest.body = {
        title: 'Valid Title',
        description: longDescription,
        sessionType: 'normal',
      };

      await createSessionCode(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Description cannot exceed 200 characters',
      });
    });

    it('should trim description before validation', async () => {
      const mockSession = {
        sessionID: 'ABC123',
        _id: 'session-id-123',
        title: 'Test Session',
        description: 'Trimmed Description',
        sessionType: 'normal',
      };

      vi.mocked(sessionService.createSession).mockResolvedValue(mockSession as any);

      mockRequest.body = {
        title: 'Test Session',
        description: '  Trimmed Description  ',
        sessionType: 'normal',
      };

      await createSessionCode(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(sessionService.createSession).toHaveBeenCalledWith({
        title: 'Test Session',
        description: 'Trimmed Description',
        sessionType: 'normal',
        length: 6,
      });
    });

    it('should use empty string for description if not provided', async () => {
      const mockSession = {
        sessionID: 'ABC123',
        _id: 'session-id-123',
        title: 'Test Session',
        description: '',
        sessionType: 'normal',
      };

      vi.mocked(sessionService.createSession).mockResolvedValue(mockSession as any);

      mockRequest.body = {
        title: 'Test Session',
        sessionType: 'normal',
      };

      await createSessionCode(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(sessionService.createSession).toHaveBeenCalledWith({
        title: 'Test Session',
        description: '',
        sessionType: 'normal',
        length: 6,
      });
    });

    it('should return 500 if createSession throws an error', async () => {
      vi.mocked(sessionService.createSession).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.body = {
        title: 'Test Session',
        sessionType: 'normal',
      };

      await createSessionCode(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Failed to generate session code',
        error: 'Database error',
      });
    });
  });

  describe('getActionContentEndpoint', () => {
    it('should return action content successfully', async () => {
      vi.mocked(sessionService.getActionContent).mockResolvedValue('Test question content');

      mockRequest.params = {
        sessionCode: 'ABC123',
        actionID: '1',
      };

      await getActionContentEndpoint(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(sessionService.getActionContent).toHaveBeenCalledWith('ABC123', 1);
      expect(mockJson).toHaveBeenCalledWith({
        content: 'Test question content',
      });
      expect(mockStatus).not.toHaveBeenCalled(); // Should use default 200
    });

    it('should return 400 if sessionCode is missing', async () => {
      mockRequest.params = {
        actionID: '1',
      };

      await getActionContentEndpoint(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'sessionCode is required',
      });
      expect(sessionService.getActionContent).not.toHaveBeenCalled();
    });

    it('should return 400 if actionID is missing', async () => {
      mockRequest.params = {
        sessionCode: 'ABC123',
      };

      await getActionContentEndpoint(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'actionID is required',
      });
      expect(sessionService.getActionContent).not.toHaveBeenCalled();
    });

    it('should return 400 if actionID is not a valid number', async () => {
      mockRequest.params = {
        sessionCode: 'ABC123',
        actionID: 'invalid',
      };

      await getActionContentEndpoint(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'actionID must be a valid number',
      });
      expect(sessionService.getActionContent).not.toHaveBeenCalled();
    });

    it('should return 400 if actionID is completely non-numeric', async () => {
      mockRequest.params = {
        sessionCode: 'ABC123',
        actionID: 'abc',
      };

      await getActionContentEndpoint(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'actionID must be a valid number',
      });
      expect(sessionService.getActionContent).not.toHaveBeenCalled();
    });

    it('should return 404 if session is not found', async () => {
      vi.mocked(sessionService.getActionContent).mockRejectedValue(
        new Error('Session not found')
      );

      mockRequest.params = {
        sessionCode: 'NONEXISTENT',
        actionID: '1',
      };

      await getActionContentEndpoint(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Session not found',
      });
    });

    it('should return 404 if action is not found', async () => {
      vi.mocked(sessionService.getActionContent).mockRejectedValue(
        new Error('Action not found')
      );

      mockRequest.params = {
        sessionCode: 'ABC123',
        actionID: '999',
      };

      await getActionContentEndpoint(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Action not found',
        sessionCode: 'ABC123',
        actionID: 999,
      });
    });

    it('should return 500 for other errors', async () => {
      vi.mocked(sessionService.getActionContent).mockRejectedValue(
        new Error('Database connection error')
      );

      mockRequest.params = {
        sessionCode: 'ABC123',
        actionID: '1',
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await getActionContentEndpoint(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Database connection error',
      });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle null content', async () => {
      vi.mocked(sessionService.getActionContent).mockResolvedValue(null);

      mockRequest.params = {
        sessionCode: 'ABC123',
        actionID: '1',
      };

      await getActionContentEndpoint(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockJson).toHaveBeenCalledWith({
        content: null,
      });
    });

    it('should parse actionID correctly from string', async () => {
      vi.mocked(sessionService.getActionContent).mockResolvedValue('Content');

      mockRequest.params = {
        sessionCode: 'ABC123',
        actionID: '42',
      };

      await getActionContentEndpoint(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(sessionService.getActionContent).toHaveBeenCalledWith('ABC123', 42);
    });
  });

  describe('getActionsWithTimesEndpoint', () => {
    it('should return actions with timeMargin successfully', async () => {
      const mockResult = {
        actions: [
          { actionID: 1, timeMargin: 125.5, size: 48, color: '#16a34a' },
          { actionID: 2, timeMargin: 130.2, size: 48, color: '#16a34a' },
        ],
      };

      vi.mocked(sessionService.getActionsWithTimes).mockResolvedValue(mockResult);

      mockRequest.params = {
        sessionCode: 'ABC123',
      };

      await getActionsWithTimesEndpoint(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(sessionService.getActionsWithTimes).toHaveBeenCalledWith('ABC123');
      expect(mockJson).toHaveBeenCalledWith({
        actions: mockResult.actions,
      });
      expect(mockStatus).not.toHaveBeenCalled(); // Should use default 200
    });

    it('should return 400 if sessionCode is missing', async () => {
      mockRequest.params = {};

      await getActionsWithTimesEndpoint(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'sessionCode is required',
      });
      expect(sessionService.getActionsWithTimes).not.toHaveBeenCalled();
    });

    it('should return 400 if sessionCode is empty string', async () => {
      mockRequest.params = {
        sessionCode: '',
      };

      await getActionsWithTimesEndpoint(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'sessionCode is required',
      });
      expect(sessionService.getActionsWithTimes).not.toHaveBeenCalled();
    });

    it('should return 404 if session is not found', async () => {
      vi.mocked(sessionService.getActionsWithTimes).mockRejectedValue(
        new Error('Session not found')
      );

      mockRequest.params = {
        sessionCode: 'NONEXISTENT',
      };

      await getActionsWithTimesEndpoint(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Session not found',
      });
    });

    it('should return 500 for other errors', async () => {
      vi.mocked(sessionService.getActionsWithTimes).mockRejectedValue(
        new Error('Database connection error')
      );

      mockRequest.params = {
        sessionCode: 'ABC123',
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await getActionsWithTimesEndpoint(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Database connection error',
      });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle empty actions array', async () => {
      const mockResult = {
        actions: [],
      };

      vi.mocked(sessionService.getActionsWithTimes).mockResolvedValue(mockResult);

      mockRequest.params = {
        sessionCode: 'ABC123',
      };

      await getActionsWithTimesEndpoint(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockJson).toHaveBeenCalledWith({
        actions: [],
      });
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(sessionService.getActionsWithTimes).mockRejectedValue('String error');

      mockRequest.params = {
        sessionCode: 'ABC123',
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await getActionsWithTimesEndpoint(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'String error',
      });

      consoleSpy.mockRestore();
    });
  });
});

