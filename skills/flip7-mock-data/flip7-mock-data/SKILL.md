---
name: flip7-mock-data
description: >
  Generate realistic Flip 7 game state data for testing and development.
  Use this skill when the user wants test data, mock game state, sample players
  and rounds, or needs to populate the app with data for UI testing. Trigger on
  phrases like "test data", "mock game", "sample data", "generate game state",
  "populate with data", "fake game", or "seed data". This is especially useful
  when you need to test how the UI looks with various game scenarios without
  manually playing through rounds.
---

# Flip 7 Mock Data Generator

This skill creates realistic game state objects that match the exact shape expected by the Flip 7 app. The generated data can be written to a JS file and imported, or injected via the storage layer.

## Game State Shape

The app expects this exact structure (from `src/context/gameReducer.js` and `src/utils/helpers.js`):

```javascript
{
  id: "abc1234",          // 7-char random alphanumeric string
  players: [
    { id: "xyz5678", name: "Alice" },
    { id: "def9012", name: "Bob" }
  ],
  rounds: [
    {
      roundNumber: 1,
      playerResults: {
        "xyz5678": {
          numberCards: [3, 5, 7, 11],
          modifiers: ["+4"],
          actions: [],
          busted: false,
          score: 30,        // must match calculateScore output
          flip7: false
        },
        "def9012": {
          numberCards: [2, 2],  // duplicate = bust
          modifiers: [],
          actions: [],
          busted: true,
          score: 0,
          flip7: false
        }
      }
    }
  ],
  lastReshuffle: 0,       // index into rounds array; 0 means never reshuffled
  createdAt: 1700000000000  // Date.now() timestamp
}
```

## Card Rules

These constraints come from `src/constants/deck.js` and `src/utils/scoring.js`. Generated data must respect them or the UI will show inconsistent state.

### Deck Composition
- **Number cards**: 0(x1), 1(x1), 2(x2), 3(x3), 4(x4), 5(x5), 6(x6), 7(x7), 8(x8), 9(x9), 10(x10), 11(x11), 12(x12)
- **Modifiers**: +2(x1), +4(x3), +6(x1), +8(x1), +10(x1), x2(x2)
- **Actions**: Freeze(x2), Flip Three(x2), Second Chance(x2)

### Scoring Rules
1. Sum all number cards
2. If x2 modifier is present, double the number sum
3. Add modifier bonuses (+2, +4, +6, +8, +10)
4. If exactly 7 number cards and no duplicates: +15 bonus (Flip 7)
5. If busted OR any duplicate number cards: score = 0

### Score Calculation (must match `calculateScore`)
```
score = (numberSum * (hasX2 ? 2 : 1)) + modifierBonus + (flip7 ? 15 : 0)
```

If busted or has duplicate numbers, score = 0 and flip7 = false.

## Generating Data

When creating mock data, write a Node.js script at `scripts/generate-mock.mjs` that:

1. Generates IDs with: `Math.random().toString(36).slice(2, 9)`
2. Creates players with realistic names
3. Generates rounds where:
   - Each player's number cards are unique within that player's hand (unless intentionally busting)
   - Scores are correctly calculated matching the `calculateScore` function
   - Card counts don't wildly exceed what's in the deck (the app tracks this via DeckTracker)
   - Include a realistic mix of normal rounds, busts, high scores, and flip-7 bonuses
4. Win threshold is 200 points (`WIN_SCORE` from deck.js)

Use ES module syntax since the project has `"type": "module"` in package.json.

## Scenario Presets

Generate data appropriate to what the user asks for. Common scenarios:

**"Early game"**: 2-4 players, 1-3 rounds, total scores under 50. Good for testing the basic scoreboard.

**"Mid game"**: 3-5 players, 5-8 rounds, scores ranging 60-150. Mix of busts and good rounds. Good for testing the typical play state.

**"Near win"**: 2-4 players, 8+ rounds, at least one player at 180-199 (close but not over 200). Good for testing the tension state.

**"Game over"**: 3-4 players, 10+ rounds, one player at 200+. Good for testing the winner banner.

**"Bust heavy"**: Several rounds where multiple players bust. Tests the bust display.

**"Flip 7 showcase"**: Include at least one round where a player gets exactly 7 unique number cards. Tests the Flip 7 bonus display.

**"Large group"**: 6-8 players, several rounds. Tests layout with many players.

If the user doesn't specify, default to "mid game" — it's the most useful for general development.

## Output Options

Depending on what the user needs:

1. **JS module**: Write a file like `src/test-data/mockGame.js` that exports the game object. The user can import it for development.

2. **JSON file**: Write a `.json` file with the game state. Can be loaded through dev tools or a test harness.

3. **Inline injection**: Show the user how to paste the data into the browser console to inject it into the running app via `window.storage.set("flip7-game-state", JSON.stringify(gameData))`.

Always verify scores are correctly calculated before outputting — a mock with incorrect scores will cause confusion when the UI shows different numbers than expected.
