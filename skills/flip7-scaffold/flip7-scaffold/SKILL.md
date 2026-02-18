---
name: flip7-scaffold
description: >
  Generate new React components for the Flip 7 project with matching CSS modules.
  Use this skill whenever you need to create a new component, screen, or UI element
  for the Flip 7 app. Also trigger when the user says things like "add a new screen",
  "create a component", "scaffold", or "new UI section". This saves time by producing
  files that already follow the project's conventions — imports, CSS module usage,
  design tokens, and folder structure — so you can focus on the actual logic.
---

# Flip 7 Component Scaffolding

This skill generates new React components that follow the established patterns in the Flip 7 project. The goal is consistency — every new component should feel like it belongs in the codebase from day one.

## Project Conventions

The Flip 7 app lives at the project root. Components go in `src/components/` in their own folder:

```
src/components/
  ComponentName/
    ComponentName.jsx
    ComponentName.module.css
```

### JSX Patterns

Every component in this project follows a recognizable shape:

1. **Imports** come in this order: React hooks (if needed), then `useGame` from context, then `ACTIONS` from the reducer, then utility functions, then sibling components, then the CSS module.

2. **Export style**: Use `export default function ComponentName()` — not arrow functions, not separate export statements.

3. **Context access**: Components that need game state use `const { game, dispatch, ... } = useGame()`. The available properties from context are: `game`, `screen`, `selectedPlayer`, `editingRound`, `dialog`, `deckOpen`, `loading`, `dispatch`, `sortedPlayers`, `winner`, `getEffectiveDealtCards`.

4. **Navigation**: Screen changes go through `dispatch({ type: ACTIONS.NAVIGATE, payload: "screenName" })`. The detail screen also passes `playerId`, and the round screen can pass `editingRound`.

5. **Wrapper structure**: Screen-level components wrap their content in `<div className="app fade-in">`. Sub-components don't need this wrapper.

6. **Buttons**: Use the global button classes — `btn`, `btn-primary`, `btn-secondary`, `btn-danger`, `btn-ghost`, and `btn-small` — rather than styling buttons per-component.

### CSS Module Patterns

The CSS modules use the project's design tokens from `global.css`:

**Colors**: `--bg`, `--surface`, `--surface2`, `--primary`, `--primary-dim`, `--accent`, `--accent2`, `--text`, `--text-dim`, `--card-bg`

**Borders**: `--radius` (16px) for larger elements, `--radius-sm` (10px) for smaller ones

**Fonts**: `'Fredoka', sans-serif` for headings/scores/numbers (always with `font-weight: 700`), `'DM Sans', sans-serif` for body text (inherited from `body`)

**Common patterns seen across components**:
- Sticky headers: `position: sticky; top: 0; background: var(--bg); z-index: 10;`
- Card-like rows: `background: var(--surface); border-radius: var(--radius-sm); padding: 14px 16px;`
- Hover borders: `border: 2px solid transparent;` then `:hover { border-color: var(--primary); }`
- Smooth transitions: `transition: all 0.2s;`
- Dim secondary text: `color: var(--text-dim); font-size: 12-13px;`

## What to Generate

When asked to create a new component:

1. Create the folder `src/components/ComponentName/`
2. Generate `ComponentName.jsx` following the import order and export style above
3. Generate `ComponentName.module.css` using the design tokens (never hardcode colors — use variables)
4. If this is a new screen, remind the user they'll need to:
   - Add it to the screen switch in `App.jsx`
   - Add a navigation action case in `gameReducer.js` under `ACTIONS.NAVIGATE`

For sub-components (things rendered inside a screen, not full screens), skip the `"app fade-in"` wrapper and keep the component focused on its piece of UI.

## Example

If asked "create a StatsPanel component that shows game statistics":

**StatsPanel.jsx**:
```jsx
import { useGame } from "../../context/GameContext";
import { getPlayerTotal } from "../../utils/helpers";
import styles from "./StatsPanel.module.css";

export default function StatsPanel() {
  const { game } = useGame();

  // component logic here...

  return (
    <div className={styles.panel}>
      {/* UI here */}
    </div>
  );
}
```

**StatsPanel.module.css**:
```css
.panel {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 12px;
}

.title {
  font-family: 'Fredoka', sans-serif;
  font-weight: 700;
  font-size: 18px;
  color: var(--primary);
  margin-bottom: 12px;
}

.statRow {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--surface2);
}

.statLabel {
  color: var(--text-dim);
  font-size: 14px;
}

.statValue {
  font-family: 'Fredoka', sans-serif;
  font-weight: 600;
  color: var(--text);
}
```

This is just a template to show the style — adapt the actual content to what the user needs.
