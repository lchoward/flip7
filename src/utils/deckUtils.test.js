import { describe, it, expect } from "vitest";
import { getRemainingCards, getTotalRemaining, getCardRemaining } from "./deckUtils";
import { DECK } from "../constants/deck";

const emptyDealt = () => ({ numbers: {}, modifiers: {}, actions: {} });

describe("getRemainingCards", () => {
  it("returns full deck when nothing dealt", () => {
    const remaining = getRemainingCards(emptyDealt(), {});
    expect(remaining.numbers).toEqual(DECK.numbers);
    expect(remaining.modifiers).toEqual(DECK.modifiers);
    expect(remaining.actions).toEqual(DECK.actions);
  });

  it("subtracts past round numbers", () => {
    const past = { numbers: { 5: 2 }, modifiers: {}, actions: {} };
    const remaining = getRemainingCards(past, {});
    expect(remaining.numbers[5]).toBe(DECK.numbers[5] - 2);
  });

  it("subtracts past round modifiers", () => {
    const past = { numbers: {}, modifiers: { "+4": 1 }, actions: {} };
    const remaining = getRemainingCards(past, {});
    expect(remaining.modifiers["+4"]).toBe(DECK.modifiers["+4"] - 1);
  });

  it("subtracts past round actions", () => {
    const past = { numbers: {}, modifiers: {}, actions: { "Freeze": 1 } };
    const remaining = getRemainingCards(past, {});
    expect(remaining.actions["Freeze"]).toBe(DECK.actions["Freeze"] - 1);
  });

  it("subtracts current player hands", () => {
    const playerData = {
      p1: { numberCards: [3, 5], modifiers: ["+2"], actions: [] },
      p2: { numberCards: [7], modifiers: [], actions: ["Freeze"] },
    };
    const remaining = getRemainingCards(emptyDealt(), playerData);
    expect(remaining.numbers[3]).toBe(DECK.numbers[3] - 1);
    expect(remaining.numbers[5]).toBe(DECK.numbers[5] - 1);
    expect(remaining.numbers[7]).toBe(DECK.numbers[7] - 1);
    expect(remaining.modifiers["+2"]).toBe(DECK.modifiers["+2"] - 1);
    expect(remaining.actions["Freeze"]).toBe(DECK.actions["Freeze"] - 1);
  });

  it("combines past rounds and current hands", () => {
    const past = { numbers: { 5: 1 }, modifiers: {}, actions: {} };
    const playerData = {
      p1: { numberCards: [5], modifiers: [], actions: [] },
    };
    const remaining = getRemainingCards(past, playerData);
    expect(remaining.numbers[5]).toBe(DECK.numbers[5] - 2);
  });

  it("never goes below zero", () => {
    const past = { numbers: { 0: 999 }, modifiers: {}, actions: {} };
    const remaining = getRemainingCards(past, {});
    expect(remaining.numbers[0]).toBe(0);
  });
});

describe("getTotalRemaining", () => {
  it("returns 94 for full deck", () => {
    const remaining = getRemainingCards(emptyDealt(), {});
    expect(getTotalRemaining(remaining)).toBe(94);
  });

  it("subtracts dealt cards from total", () => {
    const past = { numbers: { 5: 2, 3: 1 }, modifiers: { "+4": 1 }, actions: {} };
    const remaining = getRemainingCards(past, {});
    expect(getTotalRemaining(remaining)).toBe(94 - 4);
  });

  it("returns 0 when all cards dealt", () => {
    const remaining = {
      numbers: Object.fromEntries(Object.keys(DECK.numbers).map(k => [k, 0])),
      modifiers: Object.fromEntries(Object.keys(DECK.modifiers).map(k => [k, 0])),
      actions: Object.fromEntries(Object.keys(DECK.actions).map(k => [k, 0])),
    };
    expect(getTotalRemaining(remaining)).toBe(0);
  });
});

describe("getCardRemaining", () => {
  it("returns count for number cards", () => {
    const remaining = getRemainingCards(emptyDealt(), {});
    expect(getCardRemaining(remaining, "number", 12)).toBe(DECK.numbers[12]);
  });

  it("returns count for modifier cards", () => {
    const remaining = getRemainingCards(emptyDealt(), {});
    expect(getCardRemaining(remaining, "modifier", "×2")).toBe(DECK.modifiers["×2"]);
  });

  it("returns count for action cards", () => {
    const remaining = getRemainingCards(emptyDealt(), {});
    expect(getCardRemaining(remaining, "action", "Freeze")).toBe(DECK.actions["Freeze"]);
  });

  it("returns 0 for unknown card type", () => {
    const remaining = getRemainingCards(emptyDealt(), {});
    expect(getCardRemaining(remaining, "unknown", "foo")).toBe(0);
  });

  it("returns 0 for unknown value", () => {
    const remaining = getRemainingCards(emptyDealt(), {});
    expect(getCardRemaining(remaining, "number", 99)).toBe(0);
  });
});
