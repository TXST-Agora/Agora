# Agora

### Contributors
- Anubhav Bhetuwal
- Denise Boler
- Trinity Boston 
- Max Cantrell



## Getting Started
### Prerequisites
- Node.js (v18 or higher)
- pnpm (v9 or higher)

### Installation
Install dependencies for all workspaces:
```bash
pnpm install
```

### Environment Setup
#### Backend Environment
Create a `.env` file in `apps/backend/` from the example:
```bash
cp apps/backend/.env.example apps/backend/.env
```
The `.env` file should contain URLs, keys, and ports. 
Use the .env.example to begin

#### Frontend Environment
The frontend `.env` file should already exist. If not, create it from the example:
```bash
cp apps/frontend/.env.example apps/frontend/.env
```
The `.env` file should contain URLs, keys, and ports. 
Use the .env.example to begin

## Running the Application
### Option 1: Run Both Apps Together (Recommended)
From the root directory:
```bash
pnpm dev
```
This will start both the backend and frontend servers concurrently.

### Option 2: Run Apps Separately
**Backend only:**
```bash
pnpm -C apps/backend dev
```
Backend will run on `http://localhost:3000`

**Frontend only:**
```bash
pnpm -C apps/frontend dev
```
Frontend will run on `http://localhost:5173`

### Troubleshooting
**Port already in use:**
If you get an `EADDRINUSE` error, free the port:
```bash
# Free port 3000 (backend)
lsof -ti:3000 | xargs kill -9

# Free port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

## Verification
Once running, verify the setup:
- **Backend Health Check**: Visit `http://localhost:3000/healthz` - should return "ok"
- **Frontend**: Visit `http://localhost:5173` - should display "Agora (Foundation)" page with environment variables
- **Socket.IO**: Check browser DevTools → Network → WS tab to see the WebSocket connection

## Available Scripts
**From root:**
- `pnpm dev` - Start both backend and frontend in development mode
- `pnpm build` - Build both apps for production
- `pnpm typecheck` - Run TypeScript type checking for both apps

**Backend scripts** (`apps/backend`):
- `pnpm dev` - Start development server with tsx
- `pnpm build` - Compile TypeScript to JavaScript
- `pnpm typecheck` - Run TypeScript type checking

**Frontend scripts** (`apps/frontend`):
- `pnpm dev` - Start Vite development server
- `pnpm build` - Build for production
- `pnpm typecheck` - Run TypeScript type checking

## Project Structure
```
agora/
├── apps/
│   ├── backend/          # Node.js + Express + TypeScript backend
│   └── frontend/        # React + Vite + TypeScript frontend
├── configs/             # Shared configuration files
└── package.json         # Root workspace configuration
```
