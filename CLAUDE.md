# Project Instructions

## Pull Requests & Linear

When creating a pull request, check Linear for a related ticket (match by branch name, task context, or ask the user). If a related ticket exists, include a reference in the PR body — e.g., `Fixes FLI-123` or `Relates to FLI-123`. Use the Linear MCP tools to look up tickets when needed.

## Testing

When modifying game state logic (reducer actions, utility functions, helpers), always add or update corresponding tests. Run `npx vitest run` to verify.

## Git Workflow

- Before starting non-trivial code changes, create a new feature branch from main
- Branch naming: feature/<short-description> or fix/<short-description>
- Do not commit directly to main

## Documentation

When a PR changes the project structure (new files, moved files, new patterns), update this file and the auto memory MEMORY.md to reflect the changes.

---

# Repo Structure

## Tech Stack

- **Framework:** React 19.2 + Vite
- **Styling:** CSS Modules (component-scoped) + global shared CSS
- **State:** Context API + useReducer, persisted to localStorage via `window.storage`
- **Testing:** Vitest
- **Linting:** ESLint (flat config)

## Directory Layout

```
flip7/
  CLAUDE.md            # This file — project instructions & structure
  index.html           # Vite entry point
  vite.config.js       # Vite config
  eslint.config.js     # ESLint flat config
  scripts/             # Dev helper scripts (mock data, scoring test)
  skills/              # Claude Code skill definitions
  public/              # Static assets
  src/
    main.jsx           # React root mount
    App.jsx            # Top-level router (screen-based, no react-router)
    constants/         # Game constants
    context/           # State management (provider, reducer, storage)
    components/        # UI components (one directory per component)
    utils/             # Pure logic (scoring, deck, bust calc, etc.)
    styles/            # Global and shared CSS
    test-utils/        # Test helper utilities
```

## App Routing

`App.jsx` renders screens based on `state.screen` (no react-router). Screens:

| Screen          | Score Tracker Mode   | Play Mode            |
|-----------------|----------------------|----------------------|
| `home`          | HomeScreen           | HomeScreen           |
| `setup`         | SetupScreen          | SetupScreen          |
| `game`          | GameScreen           | PlayGameScreen       |
| `round`         | RoundEntry           | PlayRound            |
| `detail`        | PlayerDetail         | PlayerDetail         |
| `roundDetail`   | RoundDetail          | RoundDetail          |

## State Management

### `src/context/`

- **`GameContext.jsx`** — Provider, `useGame()` hook, `getEffectiveDealtCards()`, tiebreaker-aware winner detection
- **`gameReducer.js`** — Core reducer with `ACTIONS` enum and `initialState`. Delegates play-mode actions to sub-reducer via `PLAY_MODE_ACTIONS` Set
- **`reducers/playModeReducer.js`** — Play mode actions + helpers (`dealOneCard`, `ensureDeck`, etc.)
- **`storage.js`** — `loadGame()` / `persistGame()` using `window.storage` (async, key from constants)

### ACTIONS (gameReducer.js)

Shared: `SET_LOADING`, `LOAD_GAME`, `SET_GAME`, `SAVE_ROUND`, `RESET_DECK`, `NAVIGATE`, `TOGGLE_DECK`, `TOGGLE_CHEATER`, `START_NEW_GAME`

Play mode (delegated): `START_PLAY_ROUND`, `PLAYER_HIT`, `PLAYER_STAND`, `END_PLAY_ROUND`, `SET_TIEBREAKER`, `CLEAR_TIEBREAKER`, `RESOLVE_FLIP_THREE`, `RESOLVE_SECOND_CHANCE`, `FLIP_THREE_DEAL_NEXT`

### NAVIGATE Payload

Always an object: `{ screen, editingRound?, playerId? }`

## Components (`src/components/`)

Each component has its own directory with a `.jsx` file and `.module.css` file.

### Shared
- **ConfirmDialog** — Modal dialog, always used with local `useState` (no global dialog state)
- **DeckTracker** — Remaining/total card counts, optional reshuffle button
- **SetupScreen** — Mode toggle (Score Tracker / Play Mode), player/CPU management, 12-player max
- **HomeScreen** — Start/continue game entry point (local dialog state)
- **CardVisual** — Reusable card display (HSL number colors, amber modifiers, purple actions)
- **BustChanceBanner** — Bust probability display with color thresholds
- **HowToPlay** — Rules/instructions overlay
- **PlayerDetail** — Per-player round history view
- **RoundDetail** — Read-only round detail view

### Score Tracker Mode
- **GameScreen** — Scoreboard for tracker mode (local dialog state)
- **RoundEntry** — Manual card selection UI with deal order tracking

### Play Mode
- **PlayGameScreen** — Between-rounds scoreboard with dealer marker, tiebreaker banner
- **PlayRound** — Active gameplay: Hit/Stand buttons, card visuals, bust detection, cheater mode

## Utilities (`src/utils/`)

| File                  | Purpose                                                    |
|-----------------------|------------------------------------------------------------|
| `scoring.js`          | Score calculation, bust/flip7 detection                    |
| `bustCalculator.js`   | Bust probability using deck state                          |
| `deckBuilder.js`      | `buildDeck`, `shuffleDeck` (Fisher-Yates), `createShuffledDeck` |
| `deckUtils.js`        | `createEmptyDealtCards`, `getRemainingCards`, `getTotalRemaining`, `getCardRemaining` |
| `handUtils.js`        | `flattenHandWithCancelled` (merges cancelled cards into hand) |
| `helpers.js`          | `uid`, `newGame(mode)`, `getPlayerTotal`                   |
| `computerStrategy.js` | CPU decision logic: `decideAction`, `chooseFlipThreeTarget`, `chooseSecondChanceTarget` |

Tests live alongside source files: `*.test.js`

## Constants (`src/constants/deck.js`)

Deck definition (94 cards: 79 numbers 0–12, 9 modifiers, 6 actions), `WIN_SCORE` (200), `STORAGE_KEY`

## Styles (`src/styles/`)

- **`global.css`** — CSS variables (`--bg`, `--surface`, `--surface2`, `--primary`, `--primary-dim`, `--accent`, `--accent2`, `--text`, `--text-dim`), base styles, imports shared.css
- **`shared.css`** — Global utility classes (cpuBadge, tiebreakerBanner, cheaterToggle, bust colors, scoreboard styles)
- **`buttons.css`** — Button classes (`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-small`, `.btn-ghost`)

## Key Patterns

- **No global dialog state** — all dialogs use local `useState` in their components
- **CSS Modules** for component styles, global classes in `shared.css` for cross-component reuse
- **Play-mode reducer** extracted to separate file; main reducer delegates via `PLAY_MODE_ACTIONS` Set
- **`flattenHandWithCancelled()`** used in PlayRound and playModeReducer
- **`createEmptyDealtCards()`** used in GameContext for dealt-card tracking
- **Test helpers** in `src/test-utils/helpers.js`

## Build & Dev

- `npm run dev` — Vite dev server (requires Node 20+)
- `npm run build` — Production build (Node 18 works but shows warning)
- `npm run lint` — ESLint check
- `npx vitest run` — Run tests
