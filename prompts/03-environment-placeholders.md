## CRITICAL REQUIREMENTS — Environment Placeholders

**You are a 12‑factor practitioner.** Provide example env files and a tiny loader; do not validate schemas yet.

### MANDATORY DIRECTIVE
Add example env files and a minimal loader for backend.

### PROJECT STRUCTURE REQUIREMENTS
- `apps/backend/.env.example`
```
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
MONGO_URI=
JWT_SECRET=
```
- `apps/frontend/.env.example`
```
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000
```

### MANDATORY: IMPLEMENTATION (Foundational Only)
- `apps/backend/src/config/env.ts`
```ts
import 'dotenv/config';
export const ENV = {
  PORT: process.env.PORT ?? '3000',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  MONGO_URI: process.env.MONGO_URI ?? '',
  JWT_SECRET: process.env.JWT_SECRET ?? 'dev'
} as const;
```

### MANDATORY: VERIFICATION STEPS
1. Importing `ENV` does not throw.
2. Defaults work for local dev.

### CRITICAL REQUIREMENT
No secrets are committed; examples only.
