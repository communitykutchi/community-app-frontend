<!-- .github/copilot-instructions.md
     Purpose: Quick, actionable guidance for AI coding agents working on this repo.
     Keep it short — focus on codebase-specific patterns, commands, and gotchas.
-->

# Copilot / AI agent quickstart for community-frontend

Purpose: help an AI agent become productive quickly by documenting the project's structure, entry points, conventions, build/dev commands, and integration touchpoints.

## Project Overview

- **Project Type**: React + TypeScript + Vite (HMR). Entry: `src/main.tsx` (creates root, imports `index.css`).
- **Routing**: `src/App.tsx` uses `react-router-dom` Routes; pages live in `src/pages/*` and are used as route elements.
- **Protected Routes**: `src/routes/PrivateRoute.tsx` is used to guard routes requiring authentication.
- **Layout**: `src/layout/MainLayout.tsx` wraps pages (header/footer). Many components/pages use default exports.
- **Styling**: Tailwind CSS is used extensively for utility-based styling.
- **API Layer**: Centralize HTTP client logic in `src/api/axios.ts` (currently empty). Use `import.meta.env.VITE_API_BASE` for the base URL.

## Key Files

- `src/main.tsx`: App bootstrap and root render.
- `src/App.tsx`: Route definitions; add new routes here when adding pages.
- `src/layout/MainLayout.tsx`: Consistent page wrapper (header/footer).
- `src/pages/*`: Page components mapped from routes.
- `src/routes/PrivateRoute.tsx`: Guards routes requiring authentication.
- `src/api/axios.ts`: Intended central API surface (currently empty).

## Developer Workflows

### Build, Dev, and Lint Commands

- **Start Dev Server (HMR)**: `npm run dev` → runs `vite`.
- **Build (Type-check + Bundle)**: `npm run build` → runs `tsc -b && vite build`.
  - Note: `tsc -b` is used as a type-checking step before bundling; do not remove unless you update CI semantics.
- **Preview Built Output**: `npm run preview` → `vite preview`.
- **Lint**: `npm run lint` → runs `eslint .`.

### Debugging Tips

- Use Vite's built-in debugging tools for HMR issues.
- Check `import.meta.env` for environment-specific configurations.
- For React-specific debugging, use React Developer Tools.

## Conventions & Patterns

- **Pages**: Default exports in `src/pages/*`, referenced directly in `App.tsx` routes.
- **Components**: Small, isolated components (default export) under `src/components`.
- **Styling**: Tailwind CSS utility classes. Check `tailwind.config.js` for global styles.
- **API**: Centralize HTTP logic in `src/api/axios.ts`. Use `import.meta.env.VITE_API_BASE` for the base URL.
- **Protected Routes**: Use `PrivateRoute` for guarding routes. Example:
  ```tsx
  <Route path="/protected" element={<PrivateRoute><ProtectedPage /></PrivateRoute>} />
  ```
- **Dependency Management**: Be conservative with changes. The repo lists `react-router-dom@^7.10.0` but `@types/react-router-dom` is `^5.3.3` — this mismatch can cause type errors.

## Integration Points

- **API**: Planned to be wired through `src/api/axios.ts`. No backend URL hard-coded — use `VITE_` env vars.
- **Axios Setup**: If adding axios, also add `@types/axios` (if using TS) and update `package.json`. Example:
  ```ts
  import axios from 'axios';

  const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE,
    headers: { 'Content-Type': 'application/json' },
  });

  export default apiClient;
  ```

## Testing & CI

- **Testing**: No test scripts or framework configured. Do not assume tests exist.
- **CI**: Ensure `npm run build` passes locally before committing.

## Examples

- **Add a New Page**: Create `src/pages/MyNewPage.tsx` (default export), then add the route in `src/App.tsx`:
  ```tsx
  <Route path="/my" element={<MyNewPage />} />
  ```
- **Centralize API**: Create and export a configured instance from `src/api/axios.ts` and import it in pages/components.

## Questions / Follow-up

- The repo contains empty placeholders (`src/api/axios.ts`, `src/components/Navbar.tsx`). Let me know if you want to scaffold these files minimally or keep them untouched.

If anything here looks wrong or you want more details (examples of axios setup, suggested env keys, or preferred router/type versions), say so and I'll iterate.
