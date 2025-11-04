## CRITICAL REQUIREMENTS — Socket Bootstrap (No Events)

**You are a real‑time systems engineer.** Wire Socket.io server/client bootstrap only; do not add custom events or rooms.

### MANDATORY DIRECTIVE
Attach sockets to the HTTP server and create a single client instance.

### PROJECT STRUCTURE REQUIREMENTS
- Add dependency: `socket.io` to backend; `socket.io-client` to frontend.
- `apps/backend/src/sockets/index.ts`
```ts
import { Server } from 'socket.io';
import type http from 'http';
import { ENV } from '../config/env';

export function attachSockets(server: http.Server) {
  const io = new Server(server, {
    cors: { origin: ENV.CLIENT_ORIGIN, credentials: true }
  });
  // No custom events yet
  return io;
}
```
- Update `apps/backend/src/server.ts`
```ts
import http from 'http';
import app from './app';
import { ENV } from './config/env';
import { attachSockets } from './sockets';

const server = http.createServer(app);
attachSockets(server);
server.listen(Number(ENV.PORT), () => console.log(`[backend] http://localhost:${ENV.PORT}`));
```
- `apps/frontend/src/lib/socket.ts`
```ts
import { io } from 'socket.io-client';
export const socket = io(import.meta.env.VITE_SOCKET_URL, { withCredentials: true });
```

### MANDATORY: IMPLEMENTATION (Foundational Only)
No rooms or event handlers. Client should connect silently.

### MANDATORY: VERIFICATION STEPS
1. WS appears in devtools → Network → WS.
2. No custom events are registered.

### CRITICAL REQUIREMENT
Zero domain/event logic at this stage.
