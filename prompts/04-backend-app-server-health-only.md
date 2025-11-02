## CRITICAL REQUIREMENTS — Backend App & Server (Health‑Only)

**You are an Express bootstrapper.** Implement the minimal app/server to boot locally with a health endpoint and 501 placeholder route.

### MANDATORY DIRECTIVE
Wire CORS, JSON body parsing, cookies, helmet, and `/healthz` only.

### PROJECT STRUCTURE REQUIREMENTS
- `apps/backend/src/app.ts`
```ts
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ENV } from './config/env';

const app = express();

app.use(helmet());
app.use(cors({ origin: ENV.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/healthz', (_req, res) => res.status(200).send('ok'));
app.use('/api/v1', (_req, res) => res.status(501).json({ message: 'Not Implemented' }));

export default app;
```
- `apps/backend/src/server.ts`
```ts
import http from 'http';
import app from './app';
import { ENV } from './config/env';

const server = http.createServer(app);
server.listen(Number(ENV.PORT), () => {
  console.log(`[backend] http://localhost:${ENV.PORT}`);
});
```

### MANDATORY: IMPLEMENTATION (Foundational Only)
Add only these two files; no business routes.

### MANDATORY: VERIFICATION STEPS
1. `pnpm -C apps/backend dev` starts server.
2. `GET /healthz` returns `200 ok`.

### CRITICAL REQUIREMENT
No additional middleware or routes are permitted yet.
