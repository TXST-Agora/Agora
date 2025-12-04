import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Import Session model - it will use the mongoose connection we set up
let Session: any;

describe('Session API Endpoints', () => {
  let mongoServer: MongoMemoryServer;
  let mongoUri: string;
  let app: any;

  // Start in-memory MongoDB before all tests
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
    
    // Connect mongoose to in-memory database BEFORE importing app
    // This ensures all models use the in-memory connection
    await mongoose.connect(mongoUri);
    
    // Import Session model after connection is established
    const sessionSchemaModule = await import('../db/session-schema.js');
    Session = sessionSchemaModule.default;
    
    // Import app after mongoose is connected (app imports routes which import controllers which use Session)
    const appModule = await import('../src/app.js');
    app = appModule.default;
  });

  // Clean up database after each test
  afterEach(async () => {
    await Session.deleteMany({});
  });

  // Close database connection and stop MongoDB after all tests
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe('POST /api/session/create', () => {
    it('should create a session and return 201 with correct response structure', async () => {
      const response = await request(app)
        .post('/api/session/create')
        .send({
          title: 'Test Session',
          description: 'Test Description',
          mode: 'normal',
        })
        .expect(201);

      expect(response.body).toHaveProperty('sessionCode');
      expect(response.body).toHaveProperty('title', 'Test Session');
      expect(response.body).toHaveProperty('description', 'Test Description');
      expect(response.body).toHaveProperty('mode', 'normal');
      expect(response.body).toHaveProperty('hostStartTime');
      expect(response.body).toHaveProperty('actions');
      expect(Array.isArray(response.body.actions)).toBe(true);
      expect(response.body.actions).toHaveLength(0);
      expect(typeof response.body.sessionCode).toBe('string');
      expect(response.body.sessionCode).toHaveLength(6);
    });

    it('should create a session with colorShift mode', async () => {
      const response = await request(app)
        .post('/api/session/create')
        .send({
          title: 'Color Shift Session',
          description: 'A session with color shift mode',
          mode: 'colorShift',
        })
        .expect(201);

      expect(response.body.mode).toBe('colorShift');
      expect(response.body.title).toBe('Color Shift Session');
    });

    it('should create a session with sizePulse mode', async () => {
      const response = await request(app)
        .post('/api/session/create')
        .send({
          title: 'Size Pulse Session',
          mode: 'sizePulse',
        })
        .expect(201);

      expect(response.body.mode).toBe('sizePulse');
      expect(response.body.description).toBe('');
    });

    it('should create a session without description', async () => {
      const response = await request(app)
        .post('/api/session/create')
        .send({
          title: 'Session Without Description',
          mode: 'normal',
        })
        .expect(201);

      expect(response.body.description).toBe('');
    });

    it('should reject request with missing title (400)', async () => {
      const response = await request(app)
        .post('/api/session/create')
        .send({
          description: 'No title provided',
          mode: 'normal',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Title is required and must be a string');
    });

    it('should reject request with empty title string (400)', async () => {
      const response = await request(app)
        .post('/api/session/create')
        .send({
          title: '',
          mode: 'normal',
        })
        .expect(400);

      // Empty string is falsy, so it triggers the "required" check first
      expect(response.body).toHaveProperty('message', 'Title is required and must be a string');
    });

    it('should reject request with whitespace-only title (400)', async () => {
      const response = await request(app)
        .post('/api/session/create')
        .send({
          title: '   \n\t  ',
          mode: 'normal',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Title cannot be empty');
    });

    it('should reject request with title shorter than 3 characters (400)', async () => {
      const response = await request(app)
        .post('/api/session/create')
        .send({
          title: 'AB',
          mode: 'normal',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Title must be at least 3 characters');
    });

    it('should accept title with exactly 3 characters', async () => {
      const response = await request(app)
        .post('/api/session/create')
        .send({
          title: 'ABC',
          mode: 'normal',
        })
        .expect(201);

      expect(response.body.title).toBe('ABC');
    });

    it('should reject request with missing mode (400)', async () => {
      const response = await request(app)
        .post('/api/session/create')
        .send({
          title: 'Test Session',
          description: 'Test Description',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Mode is required and must be a string');
    });

    it('should reject request with invalid mode (400)', async () => {
      const response = await request(app)
        .post('/api/session/create')
        .send({
          title: 'Test Session',
          mode: 'invalidMode',
        })
        .expect(400);

      expect(response.body.message).toContain('Mode must be one of:');
      expect(response.body.message).toContain('normal');
      expect(response.body.message).toContain('colorShift');
      expect(response.body.message).toContain('sizePulse');
    });

    it('should reject request with description longer than 200 characters (400)', async () => {
      const longDescription = 'A'.repeat(201);
      const response = await request(app)
        .post('/api/session/create')
        .send({
          title: 'Test Session',
          description: longDescription,
          mode: 'normal',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Description cannot exceed 200 characters');
    });

    it('should accept description with exactly 200 characters', async () => {
      const description = 'A'.repeat(200);
      const response = await request(app)
        .post('/api/session/create')
        .send({
          title: 'Test Session',
          description: description,
          mode: 'normal',
        })
        .expect(201);

      expect(response.body.description).toBe(description);
    });

    it('should trim title whitespace', async () => {
      const response = await request(app)
        .post('/api/session/create')
        .send({
          title: '  Trimmed Title  ',
          mode: 'normal',
        })
        .expect(201);

      expect(response.body.title).toBe('Trimmed Title');
    });

    it('should trim description whitespace', async () => {
      const response = await request(app)
        .post('/api/session/create')
        .send({
          title: 'Test Session',
          description: '  Trimmed Description  ',
          mode: 'normal',
        })
        .expect(201);

      expect(response.body.description).toBe('Trimmed Description');
    });

    it('should generate unique session codes', async () => {
      const codes = new Set<string>();
      
      // Create multiple sessions
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/session/create')
          .send({
            title: `Session ${i}`,
            mode: 'normal',
          })
          .expect(201);

        const code = response.body.sessionCode;
        expect(codes.has(code)).toBe(false);
        codes.add(code);
      }
    });

    it('should handle database errors gracefully (500)', async () => {
      // Force a database error by closing the connection
      await mongoose.connection.close();

      const response = await request(app)
        .post('/api/session/create')
        .send({
          title: 'Test Session',
          mode: 'normal',
        })
        .expect(500);

      expect(response.body).toHaveProperty('message', 'Failed to create session');
      expect(response.body).toHaveProperty('error');

      // Reconnect for other tests
      await mongoose.connect(mongoUri);
    });
  });

  describe('POST /api/session/:sessionCode/action', () => {
    let testSessionCode: string;

    beforeEach(async () => {
      // Create a test session before each action test
      const createResponse = await request(app)
        .post('/api/session/create')
        .send({
          title: 'Test Session for Actions',
          mode: 'normal',
        })
        .expect(201);

      testSessionCode = createResponse.body.sessionCode;
    });

    it('should add a question action and return 201 with correct structure', async () => {
      const response = await request(app)
        .post(`/api/session/${testSessionCode}/action`)
        .send({
          type: 'question',
          content: 'What is the answer?',
          actionID: 1,
        })
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Action added');
      expect(response.body).toHaveProperty('action');
      expect(response.body.action).toHaveProperty('id');
      expect(response.body.action).toHaveProperty('actionID', 1);
      expect(response.body.action).toHaveProperty('type', 'question');
      expect(response.body.action).toHaveProperty('content', 'What is the answer?');
      expect(response.body.action).toHaveProperty('start_time');
      expect(typeof response.body.action.id).toBe('string');
      expect(response.body.action.id.length).toBeGreaterThan(0);
    });

    it('should add a comment action and return 201', async () => {
      const response = await request(app)
        .post(`/api/session/${testSessionCode}/action`)
        .send({
          type: 'comment',
          content: 'This is a great question!',
          actionID: 1,
        })
        .expect(201);

      expect(response.body.action.type).toBe('comment');
      expect(response.body.action.content).toBe('This is a great question!');
      expect(response.body.action.actionID).toBe(1);
    });

    it('should reject request with missing type (400)', async () => {
      const response = await request(app)
        .post(`/api/session/${testSessionCode}/action`)
        .send({
          content: 'Some content',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'type is required and must be a string');
    });

    it('should reject request with missing content (400)', async () => {
      const response = await request(app)
        .post(`/api/session/${testSessionCode}/action`)
        .send({
          type: 'question',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'content is required and must be a string');
    });

    it('should reject request with missing actionID (400)', async () => {
      const response = await request(app)
        .post(`/api/session/${testSessionCode}/action`)
        .send({
          type: 'question',
          content: 'Some content',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'actionID is required');
    });

    it('should reject request with invalid actionID (400)', async () => {
      const response = await request(app)
        .post(`/api/session/${testSessionCode}/action`)
        .send({
          type: 'question',
          content: 'Some content',
          actionID: 'not-a-number',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'actionID must be a positive integer');
    });

    it('should reject request with negative actionID (400)', async () => {
      const response = await request(app)
        .post(`/api/session/${testSessionCode}/action`)
        .send({
          type: 'question',
          content: 'Some content',
          actionID: -1,
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'actionID must be a positive integer');
    });

    it('should reject request with zero actionID (400)', async () => {
      const response = await request(app)
        .post(`/api/session/${testSessionCode}/action`)
        .send({
          type: 'question',
          content: 'Some content',
          actionID: 0,
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'actionID must be a positive integer');
    });

    it('should reject request with empty content string (400)', async () => {
      const response = await request(app)
        .post(`/api/session/${testSessionCode}/action`)
        .send({
          type: 'question',
          content: '',
          actionID: 1,
        })
        .expect(400);

      // Empty string is falsy, so it triggers the "required" check first
      expect(response.body).toHaveProperty('message', 'content is required and must be a string');
    });

    it('should reject request with whitespace-only content (400)', async () => {
      const response = await request(app)
        .post(`/api/session/${testSessionCode}/action`)
        .send({
          type: 'question',
          content: '   \n\t  ',
          actionID: 1,
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'content cannot be empty');
    });

    it('should reject request with invalid type (400)', async () => {
      const response = await request(app)
        .post(`/api/session/${testSessionCode}/action`)
        .send({
          type: 'invalidType',
          content: 'Some content',
          actionID: 1,
        })
        .expect(400);

      expect(response.body.message).toContain('type must be one of:');
      expect(response.body.message).toContain('question');
      expect(response.body.message).toContain('comment');
    });

    it('should reject request when session is not found (404)', async () => {
      const nonExistentCode = 'NONEX1';
      const response = await request(app)
        .post(`/api/session/${nonExistentCode}/action`)
        .send({
          type: 'question',
          content: 'Some content',
          actionID: 1,
        })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Session not found');
    });

    it('should successfully push action into MongoDB actions array', async () => {
      const actionContent = 'Test question content';
      
      await request(app)
        .post(`/api/session/${testSessionCode}/action`)
        .send({
          type: 'question',
          content: actionContent,
          actionID: 1,
        })
        .expect(201);

      // Verify action was saved to database
      const session = await Session.findOne({ sessionCode: testSessionCode });
      expect(session).not.toBeNull();
      expect(session?.actions).toBeDefined();
      expect(Array.isArray(session?.actions)).toBe(true);
      expect(session?.actions).toHaveLength(1);
      expect(session?.actions[0]).toHaveProperty('type', 'question');
      expect(session?.actions[0]).toHaveProperty('content', actionContent);
      expect(session?.actions[0]).toHaveProperty('id');
      expect(session?.actions[0]).toHaveProperty('actionID', 1);
      expect(session?.actions[0]).toHaveProperty('start_time');
    });

    it('should add multiple actions to the same session', async () => {
      // Add first action
      await request(app)
        .post(`/api/session/${testSessionCode}/action`)
        .send({
          type: 'question',
          content: 'First question',
          actionID: 1,
        })
        .expect(201);

      // Add second action
      await request(app)
        .post(`/api/session/${testSessionCode}/action`)
        .send({
          type: 'comment',
          content: 'First comment',
          actionID: 2,
        })
        .expect(201);

      // Verify both actions are in database
      const session = await Session.findOne({ sessionCode: testSessionCode });
      expect(session?.actions).toHaveLength(2);
      expect(session?.actions[0].type).toBe('question');
      expect(session?.actions[0].actionID).toBe(1);
      expect(session?.actions[1].type).toBe('comment');
      expect(session?.actions[1].actionID).toBe(2);
    });

    it('should trim content whitespace', async () => {
      const response = await request(app)
        .post(`/api/session/${testSessionCode}/action`)
        .send({
          type: 'question',
          content: '  Trimmed Content  ',
          actionID: 1,
        })
        .expect(201);

      expect(response.body.action.content).toBe('Trimmed Content');
    });

    it('should handle database errors gracefully (500)', async () => {
      // Force a database error by closing the connection
      await mongoose.connection.close();

      const response = await request(app)
        .post(`/api/session/${testSessionCode}/action`)
        .send({
          type: 'question',
          content: 'Test content',
          actionID: 1,
        })
        .expect(500);

      expect(response.body).toHaveProperty('message', 'Failed to add action');
      expect(response.body).toHaveProperty('error');

      // Reconnect for other tests
      await mongoose.connect(mongoUri);
    });
  });

  describe('GET /api/session/:sessionCode', () => {
    let testSessionCode: string;
    let testSessionTitle: string;
    let testSessionDescription: string;
    let testSessionMode: string;

    beforeEach(async () => {
      // Create a test session before each GET test
      testSessionTitle = 'Test Session for GET';
      testSessionDescription = 'Test Description';
      testSessionMode = 'colorShift';

      const createResponse = await request(app)
        .post('/api/session/create')
        .send({
          title: testSessionTitle,
          description: testSessionDescription,
          mode: testSessionMode,
        })
        .expect(201);

      testSessionCode = createResponse.body.sessionCode;
    });

    it('should return session object with correct structure (200)', async () => {
      const response = await request(app)
        .get(`/api/session/${testSessionCode}`)
        .expect(200);

      expect(response.body).toHaveProperty('sessionCode', testSessionCode);
      expect(response.body).toHaveProperty('title', testSessionTitle);
      expect(response.body).toHaveProperty('description', testSessionDescription);
      expect(response.body).toHaveProperty('mode', testSessionMode);
      expect(response.body).toHaveProperty('hostStartTime');
      expect(response.body).toHaveProperty('actions');
      expect(Array.isArray(response.body.actions)).toBe(true);
    });

    it('should return 404 for non-existent session code', async () => {
      const nonExistentCode = 'NONEX2';
      const response = await request(app)
        .get(`/api/session/${nonExistentCode}`)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Session not found');
    });

    it('should return session with actions array when actions exist', async () => {
      // Add an action to the session
      await request(app)
        .post(`/api/session/${testSessionCode}/action`)
        .send({
          type: 'question',
          content: 'Test question',
          actionID: 1,
        })
        .expect(201);

      // Get the session and verify actions are included
      const response = await request(app)
        .get(`/api/session/${testSessionCode}`)
        .expect(200);

      expect(response.body.actions).toHaveLength(1);
      expect(response.body.actions[0]).toHaveProperty('type', 'question');
      expect(response.body.actions[0]).toHaveProperty('content', 'Test question');
      expect(response.body.actions[0]).toHaveProperty('id');
      expect(response.body.actions[0]).toHaveProperty('actionID', 1);
      expect(response.body.actions[0]).toHaveProperty('start_time');
    });

    it('should return empty actions array when no actions exist', async () => {
      const response = await request(app)
        .get(`/api/session/${testSessionCode}`)
        .expect(200);

      expect(response.body.actions).toHaveLength(0);
    });

    it('should return session with all three valid modes', async () => {
      const modes = ['normal', 'colorShift', 'sizePulse'];
      
      for (const mode of modes) {
        const createResponse = await request(app)
          .post('/api/session/create')
          .send({
            title: `Session ${mode}`,
            mode: mode,
          })
          .expect(201);

        const sessionCode = createResponse.body.sessionCode;
        const getResponse = await request(app)
          .get(`/api/session/${sessionCode}`)
          .expect(200);

        expect(getResponse.body.mode).toBe(mode);
      }
    });

    it('should handle database errors gracefully (500)', async () => {
      // Force a database error by closing the connection
      await mongoose.connection.close();

      const response = await request(app)
        .get(`/api/session/${testSessionCode}`)
        .expect(500);

      expect(response.body).toHaveProperty('message', 'Failed to retrieve session');
      expect(response.body).toHaveProperty('error');

      // Reconnect for other tests
      await mongoose.connect(mongoUri);
    });
  });

  describe('Integration: Full session lifecycle', () => {
    it('should create session, add actions, and retrieve with all actions', async () => {
      // Create session
      const createResponse = await request(app)
        .post('/api/session/create')
        .send({
          title: 'Integration Test Session',
          description: 'Testing full lifecycle',
          mode: 'normal',
        })
        .expect(201);

      const sessionCode = createResponse.body.sessionCode;

      // Add multiple actions
      const actions = [
        { type: 'question', content: 'First question?', actionID: 1 },
        { type: 'comment', content: 'First comment', actionID: 2 },
        { type: 'question', content: 'Second question?', actionID: 3 },
      ];

      for (const action of actions) {
        await request(app)
          .post(`/api/session/${sessionCode}/action`)
          .send(action)
          .expect(201);
      }

      // Retrieve session and verify all actions
      const getResponse = await request(app)
        .get(`/api/session/${sessionCode}`)
        .expect(200);

      expect(getResponse.body.actions).toHaveLength(3);
      expect(getResponse.body.actions[0].type).toBe('question');
      expect(getResponse.body.actions[0].content).toBe('First question?');
      expect(getResponse.body.actions[1].type).toBe('comment');
      expect(getResponse.body.actions[1].content).toBe('First comment');
      expect(getResponse.body.actions[2].type).toBe('question');
      expect(getResponse.body.actions[2].content).toBe('Second question?');
    });
  });
});

