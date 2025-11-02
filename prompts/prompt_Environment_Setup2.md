**You are a senior MERN release engineer.** Declare only the minimal packages to boot both apps locally; install them. Avoid any domain libraries.

### MANDATORY DIRECTIVE
Wire root workspaces and minimal dev/build/typecheck scripts.

### PROJECT STRUCTURE REQUIREMENTS
- Root `package.json` with workspaces and scripts:
```json
{
  "private": true,
  "name": "agora",
  "packageManager": "pnpm@9",
  "workspaces": ["apps/*"],
  "scripts": {
    "dev": "pnpm -C apps/backend dev & pnpm -C apps/frontend dev",
    "build": "pnpm -C apps/backend build && pnpm -C apps/frontend build",
    "typecheck": "pnpm -C apps/backend typecheck && pnpm -C apps/frontend typecheck",
    "lint": "echo \"TODO: lint config\"",
    "format": "echo \"TODO: format config\""
  }
}
```
- **Backend runtime:** `express`, `cors`, `cookie-parser`, `helmet`, `dotenv`, `zod`
- **Backend dev:** `typescript`, `tsx`, `@types/node`, `@types/express`
- **Frontend runtime:** `react`, `react-dom`, `react-router-dom`
- **Frontend dev:** `typescript`, `vite`, `@types/react`, `@types/react-dom`

### MANDATORY: IMPLEMENTATION (Foundational Only)
- Install with `pnpm install`.
- `apps/backend/package.json`:
```json
{
  "name": "@agora/backend",
  "type": "module",
  "scripts": {
    "dev": "tsx src/server.ts",
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  }
}
```
- `apps/frontend/package.json`:
```json
{
  "name": "@agora/frontend",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  }
}
```

### MANDATORY: VERIFICATION STEPS
1. `pnpm install` succeeds.
2. Root `typecheck` runs per-app typechecks.

### CRITICAL REQUIREMENT
Only the libraries listed above may be installed at this step.
