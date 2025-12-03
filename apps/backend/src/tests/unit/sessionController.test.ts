import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type Request, type Response } from 'express';
import { createSessionCode } from '../../controllers/sessionController.js';
import * as sessionService from '../../services/sessionService.js';

// Mock the session service
vi.mock('../../services/sessionService.js', () => ({
  createSession: vi.fn(),
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
});

