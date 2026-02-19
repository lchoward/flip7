import { describe, it, expect } from "vitest";
import { uid, newGame, getPlayerTotal } from "./helpers";

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
  it("creates a play game by default", () => {
    const g = newGame();
    expect(g.mode).toBe("play");
    expect(g.players).toEqual([]);
    expect(g.rounds).toEqual([]);
    expect(g.id).toBeDefined();
    expect(g.createdAt).toBeDefined();
    expect(g.deck).toEqual([]);
    expect(g.dealerIndex).toBe(0);
    expect(g.playRound).toBeNull();
    expect(g.tiebreaker).toBeNull();
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
