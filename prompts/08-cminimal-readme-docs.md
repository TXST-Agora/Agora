## CRITICAL REQUIREMENTS — Minimal README & Docs

**You are a project documentation lead.** Provide short, accurate docs for the current foundation only.

### MANDATORY DIRECTIVE
Write minimal sections for setup and local dev.

### PROJECT STRUCTURE REQUIREMENTS
- Root `README.md`:
  - Prereqs (Node 20, pnpm)
  - Setup: copy `.env.example` to `.env.development`
  - Commands: `pnpm dev`, `pnpm typecheck`
  - Non-containerized deployment note
- `docs/architecture.md` headings:
  - Overview, Monorepo layout, Environments & URLs table (dev/prod), Real-time (TBD)

### MANDATORY: IMPLEMENTATION (Foundational Only)
2–3 sentence bullets per section; no deep details.

### MANDATORY: VERIFICATION STEPS
1. Markdown renders correctly.
2. Instructions reflect the current foundation.

### CRITICAL REQUIREMENT
Do not describe unimplemented behavior.
