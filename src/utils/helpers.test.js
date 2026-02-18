import { describe, it, expect } from "vitest";
import { uid, newGame, getPlayerTotal, getDealtCards, getDeckStatus } from "./helpers";

describe("uid", () => {
  it("returns a string", () => {
    expect(typeof uid()).toBe("string");
  });

  it("returns 7 characters", () => {
    expect(uid()).toHaveLength(7);
  });

  it("generates different values on successive calls", () => {
    const a = uid();
    const b = uid();
    expect(a).not.toBe(b);
  });
});

describe("newGame", () => {
  it("creates a tracker game by default", () => {
    const g = newGame();
    expect(g.mode).toBe("tracker");
    expect(g.players).toEqual([]);
    expect(g.rounds).toEqual([]);
    expect(g.id).toBeDefined();
    expect(g.createdAt).toBeDefined();
  });

  it("creates a tracker game explicitly", () => {
    const g = newGame("tracker");
    expect(g.mode).toBe("tracker");
    expect(g.deck).toBeUndefined();
  });

  it("creates a play game with extra fields", () => {
    const g = newGame("play");
    expect(g.mode).toBe("play");
    expect(g.deck).toEqual([]);
    expect(g.dealerIndex).toBe(0);
    expect(g.playRound).toBeNull();
    expect(g.tiebreaker).toBeNull();
  });

  it("generates unique ids", () => {
    const a = newGame();
    const b = newGame();
    expect(a.id).not.toBe(b.id);
  });
});

describe("getPlayerTotal", () => {
  it("returns 0 for no rounds", () => {
    const game = { rounds: [] };
    expect(getPlayerTotal(game, "p1")).toBe(0);
  });

  it("sums scores across rounds", () => {
    const game = {
      rounds: [
        { playerResults: { p1: { score: 10 }, p2: { score: 5 } } },
        { playerResults: { p1: { score: 20 }, p2: { score: 15 } } },
      ],
    };
    expect(getPlayerTotal(game, "p1")).toBe(30);
    expect(getPlayerTotal(game, "p2")).toBe(20);
  });

  it("treats missing player results as 0", () => {
    const game = {
      rounds: [
        { playerResults: { p1: { score: 10 } } },
      ],
    };
    expect(getPlayerTotal(game, "p2")).toBe(0);
  });
});

describe("getDealtCards", () => {
  it("returns empty counts for no rounds", () => {
    const game = { rounds: [] };
    const dealt = getDealtCards(game);
    expect(Object.values(dealt.numbers).every(v => v === 0)).toBe(true);
    expect(Object.values(dealt.modifiers).every(v => v === 0)).toBe(true);
    expect(Object.values(dealt.actions).every(v => v === 0)).toBe(true);
  });

  it("counts cards from single round", () => {
    const game = {
      rounds: [{
        playerResults: {
          p1: { numberCards: [3, 5], modifiers: ["+4"], actions: ["Freeze"] },
          p2: { numberCards: [7], modifiers: [], actions: [] },
        },
      }],
    };
    const dealt = getDealtCards(game);
    expect(dealt.numbers[3]).toBe(1);
    expect(dealt.numbers[5]).toBe(1);
    expect(dealt.numbers[7]).toBe(1);
    expect(dealt.modifiers["+4"]).toBe(1);
    expect(dealt.actions["Freeze"]).toBe(1);
  });

  it("accumulates across multiple rounds", () => {
    const game = {
      rounds: [
        { playerResults: { p1: { numberCards: [5], modifiers: [], actions: [] } } },
        { playerResults: { p1: { numberCards: [5, 5], modifiers: [], actions: [] } } },
      ],
    };
    const dealt = getDealtCards(game);
    expect(dealt.numbers[5]).toBe(3);
  });

  it("handles missing arrays gracefully", () => {
    const game = {
      rounds: [{ playerResults: { p1: {} } }],
    };
    const dealt = getDealtCards(game);
    expect(Object.values(dealt.numbers).every(v => v === 0)).toBe(true);
  });
});

describe("getDeckStatus", () => {
  it("returns totalDeck of 94", () => {
    const game = { rounds: [] };
    expect(getDeckStatus(game).totalDeck).toBe(94);
  });

  it("returns 0 dealt for no rounds", () => {
    const game = { rounds: [] };
    expect(getDeckStatus(game).totalDealt).toBe(0);
    expect(getDeckStatus(game).remaining).toBe(94);
  });

  it("calculates remaining correctly", () => {
    const game = {
      rounds: [{
        playerResults: {
          p1: { numberCards: [3, 5], modifiers: ["+4"], actions: [] },
        },
      }],
    };
    const status = getDeckStatus(game);
    expect(status.totalDealt).toBe(3);
    expect(status.remaining).toBe(91);
  });
});
