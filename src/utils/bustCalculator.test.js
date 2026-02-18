import { describe, it, expect } from "vitest";
import { calculateBustChance } from "./bustCalculator";

const emptyDealt = () => ({ numbers: {}, modifiers: {}, actions: {} });

describe("calculateBustChance", () => {
  it("returns 0% for empty hand", () => {
    const { bustChance, bustCards, totalRemaining } = calculateBustChance([], emptyDealt(), {});
    expect(bustChance).toBe(0);
    expect(bustCards).toBe(0);
    expect(totalRemaining).toBe(94);
  });

  it("calculates bust chance for a hand with one number", () => {
    const playerCards = [5];
    const { bustChance, bustCards, totalRemaining } = calculateBustChance(playerCards, emptyDealt(), {});
    // Player has a 5. allPlayerData is empty, so remaining 5s = 5 from full deck
    expect(bustCards).toBe(5);
    expect(totalRemaining).toBe(94);
    expect(bustChance).toBeCloseTo((5 / 94) * 100, 5);
  });

  it("accounts for cards already dealt in current round", () => {
    const playerCards = [5];
    const allPlayerData = {
      p1: { numberCards: [5], modifiers: [], actions: [] },
    };
    const { bustCards, totalRemaining } = calculateBustChance(playerCards, emptyDealt(), allPlayerData);
    // p1 has a 5, so remaining 5s = 5 - 1 = 4, total = 94 - 1 = 93
    expect(bustCards).toBe(4);
    expect(totalRemaining).toBe(93);
  });

  it("accounts for cards dealt in past rounds", () => {
    const playerCards = [5];
    const pastDealt = { numbers: { 5: 3 }, modifiers: {}, actions: {} };
    const { bustCards, totalRemaining } = calculateBustChance(playerCards, pastDealt, {});
    // 5 - 3 = 2 remaining 5s, total = 94 - 3 = 91
    expect(bustCards).toBe(2);
    expect(totalRemaining).toBe(91);
  });

  it("handles multiple numbers in hand", () => {
    const playerCards = [3, 7];
    const { bustCards } = calculateBustChance(playerCards, emptyDealt(), {});
    // 3 copies of 3 + 7 copies of 7 = 10 bust cards
    expect(bustCards).toBe(10);
  });

  it("returns 0% when no cards remain", () => {
    // Force all cards to be "dealt" via past rounds
    const pastDealt = {
      numbers: { ...Object.fromEntries(Object.entries({ 0:1, 1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 7:7, 8:8, 9:9, 10:10, 11:11, 12:12 })) },
      modifiers: { "+2":1, "+4":3, "+6":1, "+8":1, "+10":1, "×2":2 },
      actions: { "Freeze":2, "Flip Three":2, "Second Chance":2 },
    };
    const { bustChance } = calculateBustChance([5], pastDealt, {});
    expect(bustChance).toBe(0);
  });

  it("handles hand with no duplicates possible (all copies dealt)", () => {
    const playerCards = [0]; // only 1 copy of 0 in deck
    const pastDealt = emptyDealt();
    const allPlayerData = {
      p1: { numberCards: [0], modifiers: [], actions: [] },
    };
    const { bustCards } = calculateBustChance(playerCards, pastDealt, allPlayerData);
    // 0 has 1 copy total, 1 is held by p1, so 0 remaining
    expect(bustCards).toBe(0);
  });

  it("handles duplicate numbers in hand counting bust cards for each unique", () => {
    // Player already has [3, 3] — already busted, but the function still calculates
    const playerCards = [3, 3];
    const { bustCards } = calculateBustChance(playerCards, emptyDealt(), {});
    // Set of unique = {3}, remaining 3s = 3
    expect(bustCards).toBe(3);
  });
});
