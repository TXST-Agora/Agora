# Agora Forum Site

An interactive forum platform featuring real-time session management with dynamic modal controls and action tracking.

## Table of Contents
- [Overview](#overview)
- [Contributors](#contributors)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Features](#features)
- [Testing](#testing)
- [Available Scripts](#available-scripts)
- [Troubleshooting](#troubleshooting)

## Overview

Agora is a full-stack web application that enables hosts to create interactive sessions where participants can submit questions and comments in real-time. The platform features:
- Session creation and management
- Real-time WebSocket communication
- Interactive modal system for user actions
- Question/Comment tracking with timestamps
- Dynamic host response modes (normal, colorShift, sizePulse)

## Contributors
- Anubhav Bhetuwal
- Denise Boler
- Trinity Boston 
- Max Cantrell

## Tech Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO
- **Testing**: Vitest
- **API Documentation**: OpenAPI/Swagger

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: CSS3 with CSS Variables
- **Testing**: Vitest + React Testing Library
- **Real-time**: Socket.IO Client
- **Routing**: React Router

### Package Management
- **Monorepo**: pnpm workspaces
- **Lock File**: pnpm-lock.yaml

## Getting Started

### Prerequisites
- Node.js v18 or higher
- pnpm v9 or higher
- MongoDB (for database)

### Installation

1. **Clone the repository** (if not already cloned)
```bash
git clone <repository-url>
cd agora
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Configure environment variables**

**Backend** :
```bash
cp apps/backend/
```
Update with your MongoDB connection string and server configuration.

**Frontend**:
```bash
cp apps/frontend/
```
Update with your API endpoint configuration.

### Running the Application

**Option 1: Run Both Apps Concurrently (Recommended)**
```bash
pnpm dev
```

**Option 2: Run Separately**

Backend:
```bash
pnpm -C apps/backend dev
```
Runs on `http://localhost:3000`

Frontend:
```bash
pnpm -C apps/frontend dev
```
Runs on `http://localhost:5173`

### Verification

Once the application is running, verify:
- **Backend Health**: Visit `http://localhost:3000/healthz` (should return "ok")
- **Frontend**: Visit `http://localhost:5173` (should display landing page)
- **WebSocket**: Open DevTools → Network tab and check WS connections

## Project Structure

```
agora_forum_site/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── app.ts                 # Express app configuration
│   │   │   ├── server.ts              # Server entry point
│   │   │   ├── config/                # Environment configuration
│   │   │   ├── controllers/           # Route handlers (sessionController.ts)
│   │   │   ├── routes/                # API routes (session.ts)
│   │   │   ├── services/              # Business logic (sessionService.ts)
│   │   │   ├── sockets/               # WebSocket handlers
│   │   │   └── openapi/               # OpenAPI/Swagger specs
│   │   ├── db/                        # Database schemas and connection
│   │   ├── tests/                     # Integration tests
│   │   └── package.json
│   │
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── App.tsx                # Root component
│   │   │   ├── main.tsx               # Entry point
│   │   │   ├── components/
│   │   │   │   ├── Landing.tsx        # Landing page
│   │   │   │   ├── SessionPage.tsx    # Main session interface
│   │   │   │   ├── Host.tsx           # Host controls
│   │   │   │   ├── JoinPage.tsx       # Session join interface
│   │   │   │   └── Navbar.tsx         # Navigation
│   │   │   ├── hooks/                 # Custom React hooks
│   │   │   ├── lib/                   # Utility functions (socket.ts)
│   │   │   └── tests/                 # Component tests
│   │   ├── public/                    # Static assets
│   │   └── package.json
│   │
├── prompts/                           # Development prompts and documentation
├── mvc.puml                          # Architecture diagram
├── pnpm-workspace.yaml               # Workspace configuration
└── README.md
```

## Features

### Core Features

#### Session Management
- Create sessions with custom title, description, and mode
- Join active sessions via session code
- Real-time session state synchronization

#### Interactive Actions
- **Ask Modal**: Submit questions during sessions
- **Comment Modal**: Submit comments and feedback
- Action submission with automatic FAB (Floating Action Button) generation
- Timestamp tracking for all submissions

#### Detail Popup Modal
- Click any FAB element to view full details
- Display action type (Question/Comment)
- Show submission content and timestamp
- Remove actions with backend persistence via PATCH endpoint

#### Responsive Design
- Dynamic modal positioning with edge detection
- Direction-aware popup arrows (up/down/left/right)
- Mobile-friendly interface

#### Host Modes
- **Normal Mode**: Standard session experience
- **ColorShift Mode**: Visual feedback with color transitions
- **SizePulse Mode**: Visual feedback with size animations

### Backend Features

#### API Endpoints
- `POST /api/session/create` - Create new session
- `GET /api/session/:sessionCode` - Retrieve session details
- `POST /api/session/:sessionCode/action` - Add action (question/comment)
- `PATCH /api/session/:sessionCode/action` - Remove action
- `PATCH /api/session/:sessionCode/size` - Update session size

#### OpenAPI Documentation
- Full REST API specification at `/api/docs`
- Schema definitions for all endpoints

#### WebSocket Events
- Real-time action submissions
- Live session updates
- Participant join/leave notifications

## Testing

### Frontend Tests

Run frontend tests:
```bash
pnpm -C apps/frontend test
```

**Test Coverage**:
- SessionPage component (30+ tests)
  - Modal functionality (Ask/Comment modals)
  - Input validation
  - FAB element generation

Test files:
- `apps/frontend/src/tests/SessionPage.test.tsx`
- `apps/frontend/src/tests/Landing.test.tsx`
- `apps/frontend/src/tests/JoinPage.test.tsx`
- `apps/frontend/src/tests/HostPage.test.tsx`
- `apps/frontend/src/tests/NavBar.test.tsx`

### Backend Tests

Run backend tests:
```bash
pnpm -C apps/backend test
```

**Test Coverage**:
- Session creation validation
- Action management (POST, PATCH)
- Error handling
- Database operations

Test files:
- `apps/backend/tests/session.test.ts`
- `apps/backend/src/tests/unit/sessionController.test.ts`
- `apps/backend/src/tests/unit/sessionService.test.ts`

## Available Scripts

### Root Commands
```bash
pnpm dev         # Start both backend and frontend in development mode
pnpm build       # Build both apps for production
pnpm test        # Run all tests (backend and frontend)
pnpm typecheck   # Run TypeScript type checking for entire workspace
```

### Backend Commands
```bash
pnpm -C apps/backend dev         # Start development server
pnpm -C apps/backend build       # Compile TypeScript to JavaScript
pnpm -C apps/backend test        # Run backend tests
pnpm -C apps/backend test:ui     # Run backend tests with UI
pnpm -C apps/backend typecheck   # Check types
```

### Frontend Commands
```bash
pnpm -C apps/frontend dev        # Start Vite development server
pnpm -C apps/frontend build      # Build for production
pnpm -C apps/frontend test       # Run frontend tests
pnpm -C apps/frontend test:ui    # Run frontend tests with UI
pnpm -C apps/frontend typecheck  # Check types
```

## Troubleshooting

### Port Already in Use

If you encounter `EADDRINUSE` errors:

**Windows PowerShell**:
```powershell
# Free port 3000 (backend)
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force

# Free port 5173 (frontend)
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess -Force
```

**macOS/Linux**:
```bash
# Free port 3000 (backend)
lsof -ti:3000 | xargs kill -9

# Free port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### Database Connection Issues

Ensure MongoDB is running and accessible. Check your `.env` file for correct `MONGODB_URI`:
```env
MONGODB_URI=mongodb://localhost:27017/agora
```

### WebSocket Connection Issues

1. Verify both servers are running
2. Check browser DevTools → Network → WS tab for connection errors
3. Ensure CORS is properly configured in backend

### Tests Failing

1. Clear node_modules and reinstall:
```bash
pnpm install
```

2. Ensure MongoDB is running for integration tests

3. Check TypeScript compilation:
```bash
pnpm typecheck
```

## Development Notes

### Git Branch
run on main branch

### Architecture
The project follows MVC pattern with clear separation between:
- Controllers (HTTP request handling)
- Services (Business logic)
- Models (Database schemas)
- Components (UI presentation)

### Type Safety
- Strict TypeScript configuration across both apps
- Full type coverage for API contracts
- Type-safe database operations with Mongoose

### Code Quality
- ESLint for code style enforcement
- TypeScript compiler for type checking
- Comprehensive test coverage for critical paths
