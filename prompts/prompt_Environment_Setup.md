**You are a senior MERN architect.** Create only the workspace skeleton and placeholder files; do **not** implement features or business logic.

### MANDATORY DIRECTIVE
Create a pnpm monorepo named `agora` with two apps: **apps/backend** (Node + TypeScript) and **apps/frontend** (React + Vite + TypeScript). Only folders, baseline files, and placeholder content.

### PROJECT STRUCTURE REQUIREMENTS
Create exactly:
```
agora/
├── package.json
├── pnpm-workspace.yaml
├── .editorconfig
├── .gitignore
├── .eslintignore
├── .prettierignore
├── README.md
├── configs/{eslint/,prettier/}
└── apps/
    ├── backend/{package.json, tsconfig.json, src/{server.ts,app.ts,config/{env.ts,logger.ts,rateLimit.ts},db/{connect.ts},middlewares/,modules/,sockets/index.ts,utils/,openapi/spec.yaml,tests/{unit/,integration/}}}
    └── frontend/{package.json, tsconfig.json, vite.config.ts, src/{main.tsx,App.tsx,routes/{Landing.tsx,Join.tsx,Host.tsx,Session.tsx,NotFound.tsx},styles/globals.css,__tests__/}}
```

### MANDATORY: IMPLEMENTATION (Foundational Only)
Create empty files with `// TODO` headers only.

### MANDATORY: VERIFICATION STEPS
1. Tree matches exactly.
2. Files contain placeholders only.

### CRITICAL REQUIREMENT
Complete the scaffold before adding any code.
