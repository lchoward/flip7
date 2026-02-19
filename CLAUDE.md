# Project Instructions

## Pull Requests & Linear

When creating a pull request, check Linear for a related ticket (match by branch name, task context, or ask the user). If a related ticket exists, include a reference in the PR body — e.g., `Fixes FLI-123` or `Relates to FLI-123`. Use the Linear MCP tools to look up tickets when needed.

## Testing

When modifying game state logic (reducer actions, utility functions, helpers), always add or update corresponding tests. Run `npx vitest run` to verify.
