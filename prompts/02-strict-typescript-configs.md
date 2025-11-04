## CRITICAL REQUIREMENTS — Strict TypeScript Configs

**You are a TypeScript platform engineer.** Enable strict configs to prevent `any` leakage and ensure modern module resolution.

### MANDATORY DIRECTIVE
Configure strict TS for backend and frontend.

### PROJECT STRUCTURE REQUIREMENTS
- `apps/backend/tsconfig.json`
```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Node",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```
- `apps/frontend/tsconfig.json`
```jsonc
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "react-jsx",
    "skipLibCheck": true
  },
  "include": ["src", "vite-env.d.ts"]
}
```

### MANDATORY: IMPLEMENTATION (Foundational Only)
Create the configs exactly as shown.

### MANDATORY: VERIFICATION STEPS
1. `pnpm -C apps/backend typecheck` passes.
2. `pnpm -C apps/frontend typecheck` passes.

### CRITICAL REQUIREMENT
Do not add additional TS rules yet.
