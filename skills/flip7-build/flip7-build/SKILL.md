---
name: flip7-build
description: >
  Build the Flip 7 project and report on errors, warnings, and bundle size.
  Use this skill whenever the user wants to check if the project builds correctly,
  see bundle stats, run linting, or do a quick health check on the codebase.
  Trigger on phrases like "build", "does it compile", "check for errors",
  "lint", "bundle size", "production build", or "is everything working".
---

# Flip 7 Build & Preview

This skill runs the Flip 7 Vite build pipeline and gives a clear report on the project's health.

## Project Setup

The project is a React 19 + Vite 7 app. Key commands:

- **Build**: `npm run build` (runs `vite build`, output goes to `dist/`)
- **Lint**: `npm run lint` (runs ESLint with react-hooks and react-refresh plugins)
- **Dev**: `npm run dev` (starts Vite dev server with HMR)
- **Preview**: `npm run preview` (serves the production build locally)

All commands should be run from the project root.

## What to Do

### Quick Health Check (default)

Run both lint and build, then summarize:

1. Run `npm run lint` from the project root. Capture any warnings or errors.
2. Run `npm run build` from the project root. Capture the output.
3. Report:
   - Whether lint passed (and list any warnings)
   - Whether the build succeeded
   - The bundle sizes from Vite's output (it prints a file size table)
   - Any notable warnings from the build

Format the report concisely — the user wants a quick "all good" or a clear list of what's wrong.

### If Errors Are Found

When the build or lint fails:
- Show the actual error messages clearly
- Identify which file(s) are affected
- Suggest fixes if they're straightforward (unused imports, missing dependencies, etc.)
- Offer to fix simple issues automatically

### Bundle Size Analysis

If the user specifically asks about bundle size or performance:
- Run the build and parse the output table
- Note the total JS and CSS sizes (both raw and gzipped)
- Compare against reasonable baselines for a small React app (under 100KB gzipped JS is healthy for an app this size)
- If the bundle seems large, check for obvious causes (large dependencies, unoptimized imports)

### Preview Mode

If the user wants to see the production build running:
- Run `npm run build` first to ensure a fresh build
- Then run `npm run preview` to start the preview server
- Let the user know the URL (typically http://localhost:4173)
- Note: the preview server should be run in the background so the user can interact with it

## Important Notes

- Always run commands from the project root directory
- The project has no test framework set up, so don't try to run tests
- Node modules should already be installed; if `npm run build` fails with module-not-found, run `npm install` first
- The ESLint config is in `eslint.config.js` (flat config format, not `.eslintrc`)
