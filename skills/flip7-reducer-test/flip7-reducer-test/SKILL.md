---
name: flip7-reducer-test
description: >
  Run the Flip 7 game reducer test suite and report results. Use this skill when
  the user changes the game reducer, play mode reducer, helper functions, or any
  game state logic and wants to verify nothing is broken. Also use when adding new
  reducer actions or modifying existing ones. Trigger on phrases like "run tests",
  "test reducer", "did I break anything", "run the suite", "check tests",
  "verify game logic", or "test play mode".
---

# Flip 7 Reducer Test Runner

This skill runs the Vitest test suite for the game reducer and reports clear pass/fail results. It covers the core game state machine: navigation, score tracker mode, play mode (dealing, busting, action cards), and tiebreaker logic.

## Test Infrastructure

- **Test runner**: Vitest (`npm run test` or `npx vitest run`)
- **Test files** (run all by default):
  - `src/context/gameReducer.test.js` — reducer actions (core + play mode)
  - `src/utils/helpers.test.js` — helper functions (uid, newGame, getPlayerTotal)
  - `src/utils/scoring.test.js` — score calculation
  - `src/utils/deckBuilder.test.js` — deck building and shuffling
  - `src/utils/deckUtils.test.js` — remaining-card calculations
  - `src/utils/bustCalculator.test.js` — bust probability
- **Test helpers**: `src/test-utils/helpers.js` — factory functions for test state

### Factory Functions (from test-utils/helpers.js)

```javascript
numberCard(v)       // { type: "number", value: v }
modifierCard(v)     // { type: "modifier", value: v }
actionCard(v)       // { type: "action", value: v }
makeHand(overrides) // default: { numberCards:[], modifiers:[], actions:[], cancelledCards:[], status:"playing", hasSecondChance:false }
makePlayRound(overrides) // default: { turnIndex:0, turnOrder:[], playerHands:{}, dealLog:[], pendingAction:null }
makeGame(overrides) // default: { id:"test-game", players:[], rounds:[], createdAt:1000, mode:"play", deck:[], dealerIndex:0, playRound:null, tiebreaker:null }
makeState(gameOverrides, stateOverrides) // wraps makeGame in initialState
```

## What to Do

### Default: Run All Tests

1. Run `npx vitest run` from the project root. Capture the full output.
2. Report:
   - Total tests passed / failed / skipped
   - If all pass: confirm with a brief summary
   - If any fail: show the failing test name, expected vs actual, and the relevant describe block
3. If failures look related to recent changes, identify which reducer action or utility is affected and suggest a fix.

### Targeted: Run Specific Test File

If the user wants to test a specific area, run only the relevant file:

- **Reducer only**: `npx vitest run src/context/gameReducer.test.js`
- **Scoring only**: `npx vitest run src/utils/scoring.test.js`
- **Helpers only**: `npx vitest run src/utils/helpers.test.js`
- **Deck building**: `npx vitest run src/utils/deckBuilder.test.js`
- **Deck utils**: `npx vitest run src/utils/deckUtils.test.js`
- **Bust calculator**: `npx vitest run src/utils/bustCalculator.test.js`

### After Failures: Diagnose and Fix

When tests fail:

1. Read the failing test to understand what it expects
2. Read the relevant source code (reducer action or utility function)
3. Identify the mismatch — is the test wrong or the code wrong?
4. If the code is wrong: suggest or apply a fix, then re-run the failing test to confirm
5. If the test is wrong (e.g., expectations don't match new intended behavior): update the test and explain what changed

### Adding New Tests

When the user adds a new reducer action or modifies behavior, offer to add tests. Follow these patterns:

**For a new reducer action:**
```javascript
describe("NEW_ACTION", () => {
  it("does the expected thing", () => {
    const state = makeState({
      // game overrides relevant to this action
    });
    const result = gameReducer(state, { type: ACTIONS.NEW_ACTION, payload: {...} });
    expect(result.game.someField).toBe(expectedValue);
  });
});
```

**For play mode actions** (delegated to playModeReducer):
```javascript
it("handles the play mode scenario", () => {
  const state = makeState({
    players: [{ id: "p1" }, { id: "p2" }],
    deck: [numberCard(X), ...],
    playRound: makePlayRound({
      turnIndex: 0,
      turnOrder: ["p1", "p2"],
      playerHands: { p1: makeHand({...}), p2: makeHand({...}) },
    }),
  });
  const result = gameReducer(state, { type: ACTIONS.PLAY_ACTION });
  // Assert on result.game.playRound fields
});
```

**For integration tests** (multi-step sequences):
```javascript
it("plays through a complete scenario", () => {
  let s = makeState({...});
  s = gameReducer(s, { type: ACTIONS.START_PLAY_ROUND });
  s = gameReducer(s, { type: ACTIONS.PLAYER_HIT });
  // ... chain actions
  s = gameReducer(s, { type: ACTIONS.END_PLAY_ROUND });
  expect(s.game.rounds).toHaveLength(1);
});
```

## Test Coverage Map

The existing test suite covers these reducer actions:

| Action | Tested | Key scenarios |
|--------|--------|---------------|
| SET_LOADING | Yes | Sets loading flag |
| NAVIGATE | Yes | All screens, clears selection, unknown screen |
| TOGGLE_DECK | Yes | Toggles deckOpen |
| TOGGLE_CHEATER | Yes | Toggles cheaterMode |
| LOAD_GAME | Yes | No players → home, players → game, playRound → round |
| START_NEW_GAME | Yes | Default mode, play mode fields |
| SAVE_ROUND | Yes | Append new, replace existing |
| RESET_DECK | Yes | Sets lastReshuffle |
| START_PLAY_ROUND | Yes | Turn order, empty hands, tiebreaker filter, empty deck shuffle, screen |
| PLAYER_HIT | Yes | Number cards, bust, Second Chance save, auto-stand at 7, modifiers, Freeze, Second Chance gift, Flip Three (target + auto-self), turn wrapping, skip busted, deal log |
| PLAYER_STAND | Yes | Sets stood, advances turn, all done |
| RESOLVE_FLIP_THREE | Yes | First card deal, bust on first, freeze on first |
| FLIP_THREE_DEAL_NEXT | Yes | Deal + decrement, clear on done, stop on bust, no-op without pending, chained Flip Three |
| RESOLVE_SECOND_CHANCE | Yes | Transfer to target |
| END_PLAY_ROUND | Yes | Score calc, dealer rotation, wrap, clear playRound, tiebreaker exclusion, cancelledCards merge |
| SET_TIEBREAKER | Yes | Sets playerIds and startedAtRound |
| CLEAR_TIEBREAKER | Yes | Clears to null |
| Integration | Yes | Full round: start → hits → stands → end |

### Potential Gaps to Watch

These areas have limited coverage and are worth adding tests for when they change:

- **SET_GAME**: Not tested (trivial setter, but good to have)
- **Mid-round deck reshuffle** (`ensureDeck`): The reducer handles this but no test verifies the deck is rebuilt correctly when it runs out mid-round
- **Flip Three chained into Second Chance gift**: Complex queue interactions
- **Second Chance during Flip Three dealing**: When Second Chance save fires during a Flip Three deal sequence
- **Multiple consecutive Flip Three cards**: Deep chaining
- **Auto-stand at 7 during Flip Three**: Player reaches 7 unique numbers via Flip Three dealing
- **All players bust**: Round ends with everyone at 0

## Reporting

Format results clearly:

```
Flip 7 Test Suite
=================
  src/context/gameReducer.test.js    42 passed
  src/utils/helpers.test.js           8 passed
  src/utils/scoring.test.js          12 passed
  src/utils/deckBuilder.test.js       6 passed
  src/utils/deckUtils.test.js         5 passed
  src/utils/bustCalculator.test.js    4 passed
─────────────────────────────────────
Total: 77 passed, 0 failed
```

On failure:
```
FAIL  src/context/gameReducer.test.js > PLAYER_HIT > number cards > busts player on duplicate number
  Expected: "busted"
  Received: "playing"

  The PLAYER_HIT action no longer marks duplicate numbers as bust.
  Check dealOneCard() in src/context/reducers/playModeReducer.js — the
  hasDuplicateNumbers check may have been removed or modified.
```

## Important Notes

- Always run from the project root directory
- Tests use Vitest (not Jest) — same API but different runner
- The play mode reducer is in a separate file (`src/context/reducers/playModeReducer.js`) but tested through the main `gameReducer` since the delegation is transparent
- Test helpers are in `src/test-utils/helpers.js` — use these factories, don't construct state objects by hand
- If `npm run test` fails with module errors, try `npm install` first
