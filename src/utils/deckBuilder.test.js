import { describe, it, expect } from "vitest";
import { buildDeck, shuffleDeck, createShuffledDeck } from "./deckBuilder";
import { DECK } from "../constants/deck";

describe("buildDeck", () => {
  it("returns exactly 94 cards", () => {
    expect(buildDeck()).toHaveLength(94);
  });

  it("has correct number card counts", () => {
    const deck = buildDeck();
    const numbers = deck.filter(c => c.type === "number");
    const expectedCount = Object.values(DECK.numbers).reduce((a, b) => a + b, 0);
    expect(numbers).toHaveLength(expectedCount);
  });

  it("has correct modifier card counts", () => {
    const deck = buildDeck();
    const mods = deck.filter(c => c.type === "modifier");
    const expectedCount = Object.values(DECK.modifiers).reduce((a, b) => a + b, 0);
    expect(mods).toHaveLength(expectedCount);
  });

  it("has correct action card counts", () => {
    const deck = buildDeck();
    const actions = deck.filter(c => c.type === "action");
    const expectedCount = Object.values(DECK.actions).reduce((a, b) => a + b, 0);
    expect(actions).toHaveLength(expectedCount);
  });

  it("has correct count for each number value", () => {
    const deck = buildDeck();
    for (const [value, count] of Object.entries(DECK.numbers)) {
      const matches = deck.filter(c => c.type === "number" && c.value === Number(value));
      expect(matches).toHaveLength(count);
    }
  });

  it("has correct count for each modifier value", () => {
    const deck = buildDeck();
    for (const [value, count] of Object.entries(DECK.modifiers)) {
      const matches = deck.filter(c => c.type === "modifier" && c.value === value);
      expect(matches).toHaveLength(count);
    }
  });

  it("has correct count for each action value", () => {
    const deck = buildDeck();
    for (const [value, count] of Object.entries(DECK.actions)) {
      const matches = deck.filter(c => c.type === "action" && c.value === value);
      expect(matches).toHaveLength(count);
    }
  });
});

describe("shuffleDeck", () => {
  it("preserves deck length", () => {
    const deck = buildDeck();
    expect(shuffleDeck(deck)).toHaveLength(94);
  });

  it("does not mutate the input array", () => {
    const deck = buildDeck();
    const original = [...deck];
    shuffleDeck(deck);
    expect(deck).toEqual(original);
  });

  it("preserves all card counts after shuffle", () => {
    const deck = buildDeck();
    const shuffled = shuffleDeck(deck);
    const countByKey = (arr) => {
      const map = {};
      arr.forEach(c => {
        const key = `${c.type}:${c.value}`;
        map[key] = (map[key] || 0) + 1;
      });
      return map;
    };
    expect(countByKey(shuffled)).toEqual(countByKey(deck));
  });
});

describe("createShuffledDeck", () => {
  it("returns 94 cards", () => {
    expect(createShuffledDeck()).toHaveLength(94);
  });

  it("returns a shuffled deck (builds then shuffles)", () => {
    const deck = createShuffledDeck();
    const countByKey = (arr) => {
      const map = {};
      arr.forEach(c => {
        const key = `${c.type}:${c.value}`;
        map[key] = (map[key] || 0) + 1;
      });
      return map;
    };
    const expected = countByKey(buildDeck());
    expect(countByKey(deck)).toEqual(expected);
  });
});
