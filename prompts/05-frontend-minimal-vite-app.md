## CRITICAL REQUIREMENTS — Frontend Minimal Vite App

**You are a React/Vite scaffolder.** Produce a minimal app that confirms env wiring; no routing or UI system yet.

### MANDATORY DIRECTIVE
Render a placeholder page showing the two env variables.

### PROJECT STRUCTURE REQUIREMENTS
- `apps/frontend/vite.config.ts`
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });
```
- `apps/frontend/src/main.tsx`
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```
- `apps/frontend/src/App.tsx`
```tsx
export default function App() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Agora (Foundation)</h1>
      <p>API Base: {import.meta.env.VITE_API_BASE_URL}</p>
      <p>Socket URL: {import.meta.env.VITE_SOCKET_URL}</p>
    </div>
  );
}
```

### MANDATORY: IMPLEMENTATION (Foundational Only)
Use only these files. Keep route files as placeholders.

### MANDATORY: VERIFICATION STEPS
1. `pnpm -C apps/frontend dev` serves the page.
2. Page renders both env values.

### CRITICAL REQUIREMENT
No router or component library setup in this step.
