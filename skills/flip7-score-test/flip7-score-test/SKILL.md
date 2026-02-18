---
name: flip7-score-test
description: >
  Run the Flip 7 scoring engine against a suite of edge cases to verify correctness.
  Use this skill when the user changes the scoring logic, modifies calculateScore,
  adjusts card values, or just wants to verify that scoring works correctly.
  Trigger on phrases like "test scoring", "verify scores", "run score tests",
  "check calculateScore", "scoring edge cases", or "did I break scoring".
---

# Flip 7 Score Calculator Tester

This skill runs `calculateScore` from `src/utils/scoring.js` against a comprehensive set of test cases and reports pass/fail results. It catches regressions when scoring logic changes.

## How the Scoring Works

From `src/utils/scoring.js`:

```
calculateScore(numberCards, modifiers, busted)
```

Returns: `{ total, numberSum, doubled, modifierBonus, flip7, breakdown }`

**Rules**:
1. If `busted` is true OR `numberCards` has duplicates: total = 0
2. Otherwise: `numberSum` = sum of all number cards
3. If modifiers includes "x2": double the number sum
4. `modifierBonus` = sum of all +N modifiers (parse the number from "+2", "+4", etc.)
5. If exactly 7 number cards (and not busted): +15 flip7 bonus
6. `total` = doubled (or not) numberSum + modifierBonus + flip7 bonus

## Running the Tests

Create and run a Node.js test script at `scripts/test-scoring.mjs`. The script should:

1. Import `calculateScore` and `hasDuplicateNumbers` from `../src/utils/scoring.js`
2. Run every test case from the table below
3. Compare actual output against expected output
4. Print a clear pass/fail report with details on any failures

Since the project uses ES modules (`"type": "module"` in package.json), use `import` syntax.

Run with: `node scripts/test-scoring.mjs` from the project root.

## Test Cases

### Basic scoring

| # | numberCards | modifiers | busted | expected total | notes |
|---|-----------|-----------|--------|---------------|-------|
| 1 | [] | [] | false | 0 | empty hand |
| 2 | [5] | [] | false | 5 | single card |
| 3 | [3, 5, 7] | [] | false | 15 | simple sum |
| 4 | [0] | [] | false | 0 | zero card |
| 5 | [12] | [] | false | 12 | highest number |
| 6 | [1, 2, 3, 4, 5, 6, 7] | [] | false | 43 | seven unique cards = flip7: 28 + 15 |

### Busting

| # | numberCards | modifiers | busted | expected total | notes |
|---|-----------|-----------|--------|---------------|-------|
| 7 | [3, 5, 7] | [] | true | 0 | explicit bust flag |
| 8 | [3, 3] | [] | false | 0 | duplicate numbers = auto bust |
| 9 | [5, 5, 5] | [] | false | 0 | triple duplicate |
| 10 | [0, 0] | [] | false | 0 | duplicate zeros |
| 11 | [3, 5, 3] | ["+4"] | false | 0 | bust ignores modifiers |

### Modifiers

| # | numberCards | modifiers | busted | expected total | notes |
|---|-----------|-----------|--------|---------------|-------|
| 12 | [3, 5] | ["+2"] | false | 10 | plus-two |
| 13 | [3, 5] | ["+4"] | false | 12 | plus-four |
| 14 | [3, 5] | ["+6"] | false | 14 | plus-six |
| 15 | [3, 5] | ["+8"] | false | 16 | plus-eight |
| 16 | [3, 5] | ["+10"] | false | 18 | plus-ten |
| 17 | [3, 5] | ["x2"] | false | 16 | doubler: (3+5)*2 = 16 |
| 18 | [3, 5] | ["x2", "+4"] | false | 20 | doubler + bonus: (8*2) + 4 = 20 |
| 19 | [10] | ["+2", "+4", "+6"] | false | 22 | multiple bonuses: 10 + 2 + 4 + 6 |
| 20 | [1, 2] | ["x2", "+2", "+4"] | false | 12 | doubler + bonuses: (3*2) + 2 + 4 = 12 |

### Flip 7 bonus

| # | numberCards | modifiers | busted | expected total | notes |
|---|-----------|-----------|--------|---------------|-------|
| 21 | [0, 1, 2, 3, 4, 5, 6] | [] | false | 36 | flip7 with low cards: 21 + 15 |
| 22 | [6, 7, 8, 9, 10, 11, 12] | [] | false | 78 | flip7 with high cards: 63 + 15 |
| 23 | [0, 1, 2, 3, 4, 5, 6] | ["x2"] | false | 57 | flip7 + doubler: 42 + 15 |
| 24 | [0, 1, 2, 3, 4, 5, 6] | ["+10", "x2"] | false | 67 | flip7 + doubler + bonus: 42 + 10 + 15 |
| 25 | [1, 2, 3, 4, 5, 6] | [] | false | 21 | six cards, no flip7 |
| 26 | [0, 1, 2, 3, 4, 5, 6, 7] | [] | false | 28 | eight cards, no flip7 |

### Return value checks

For test case #18 ([3,5] with ["x2", "+4"]):
- `total` should be 20
- `numberSum` should be 8
- `doubled` should be true
- `modifierBonus` should be 4
- `flip7` should be false

For test case #23 ([0,1,2,3,4,5,6] with ["x2"]):
- `total` should be 57
- `numberSum` should be 21
- `doubled` should be true
- `modifierBonus` should be 0
- `flip7` should be true

**Important**: The x2 modifier in the actual source code is the Unicode multiply sign "x2" (U+00D7), not the letter "x". Make sure test cases use the correct character to match the source. Read `src/constants/deck.js` to confirm the exact string.

## Also Test: hasDuplicateNumbers

This helper is used by `calculateScore` internally, but worth testing directly:

| input | expected |
|-------|----------|
| [] | false |
| [5] | false |
| [3, 5, 7] | false |
| [3, 3] | true |
| [1, 2, 3, 2] | true |
| [0, 0] | true |

## Reporting

Print results in a clear format:

```
Flip 7 Score Calculator Tests
==============================
  Pass: Test 1 — empty hand = 0
  Pass: Test 2 — single card = 5
  FAIL: Test 8 — duplicate numbers: expected 0, got 6
...
Results: 24/26 passed, 2 failed
```

If all tests pass, just confirm it. If any fail, show the expected vs actual values and which properties differed so the user can quickly pinpoint the issue.
