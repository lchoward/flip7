import { describe, it, expect } from "vitest";
import { calculateScore, hasDuplicateNumbers } from "./scoring";

describe("hasDuplicateNumbers", () => {
  it("returns false for empty array", () => {
    expect(hasDuplicateNumbers([])).toBe(false);
  });

  it("returns false for single card", () => {
    expect(hasDuplicateNumbers([5])).toBe(false);
  });

  it("returns false for all unique", () => {
    expect(hasDuplicateNumbers([3, 5, 7])).toBe(false);
  });

  it("returns true for duplicates", () => {
    expect(hasDuplicateNumbers([3, 3])).toBe(true);
  });

  it("returns true for non-adjacent duplicates", () => {
    expect(hasDuplicateNumbers([1, 2, 3, 2])).toBe(true);
  });

  it("returns true for duplicate zeros", () => {
    expect(hasDuplicateNumbers([0, 0])).toBe(true);
  });
});

describe("calculateScore", () => {
  describe("basic scoring", () => {
    it("scores empty hand as 0", () => {
      const r = calculateScore([], [], false);
      expect(r.total).toBe(0);
      expect(r.flip7).toBe(false);
    });

    it("scores single card", () => {
      expect(calculateScore([5], [], false).total).toBe(5);
    });

    it("sums multiple cards", () => {
      expect(calculateScore([3, 5, 7], [], false).total).toBe(15);
    });

    it("scores zero card as 0", () => {
      expect(calculateScore([0], [], false).total).toBe(0);
    });

    it("scores highest number card", () => {
      expect(calculateScore([12], [], false).total).toBe(12);
    });
  });

  describe("busting", () => {
    it("scores 0 when explicit bust flag", () => {
      const r = calculateScore([3, 5, 7], [], true);
      expect(r.total).toBe(0);
      expect(r.breakdown).toBe("Busted! 0 pts");
    });

    it("scores 0 for duplicate numbers", () => {
      expect(calculateScore([3, 3], [], false).total).toBe(0);
    });

    it("scores 0 for triple duplicates", () => {
      expect(calculateScore([5, 5, 5], [], false).total).toBe(0);
    });

    it("scores 0 for duplicate zeros", () => {
      expect(calculateScore([0, 0], [], false).total).toBe(0);
    });

    it("ignores modifiers when busted", () => {
      expect(calculateScore([3, 5, 3], ["+4"], false).total).toBe(0);
    });
  });

  describe("modifiers", () => {
    it("adds +2", () => {
      expect(calculateScore([3, 5], ["+2"], false).total).toBe(10);
    });

    it("adds +4", () => {
      expect(calculateScore([3, 5], ["+4"], false).total).toBe(12);
    });

    it("adds +6", () => {
      expect(calculateScore([3, 5], ["+6"], false).total).toBe(14);
    });

    it("adds +8", () => {
      expect(calculateScore([3, 5], ["+8"], false).total).toBe(16);
    });

    it("adds +10", () => {
      expect(calculateScore([3, 5], ["+10"], false).total).toBe(18);
    });

    it("applies ×2 doubler", () => {
      expect(calculateScore([3, 5], ["×2"], false).total).toBe(16);
    });

    it("applies doubler then adds bonus", () => {
      const r = calculateScore([3, 5], ["×2", "+4"], false);
      expect(r.total).toBe(20);
      expect(r.numberSum).toBe(8);
      expect(r.doubled).toBe(true);
      expect(r.modifierBonus).toBe(4);
      expect(r.flip7).toBe(false);
    });

    it("stacks multiple bonuses", () => {
      expect(calculateScore([10], ["+2", "+4", "+6"], false).total).toBe(22);
    });

    it("applies doubler with multiple bonuses", () => {
      expect(calculateScore([1, 2], ["×2", "+2", "+4"], false).total).toBe(12);
    });
  });

  describe("Flip 7 bonus", () => {
    it("awards 15 pts for exactly 7 unique cards", () => {
      const r = calculateScore([1, 2, 3, 4, 5, 6, 7], [], false);
      expect(r.total).toBe(43);
      expect(r.flip7).toBe(true);
    });

    it("awards flip7 with low cards", () => {
      expect(calculateScore([0, 1, 2, 3, 4, 5, 6], [], false).total).toBe(36);
    });

    it("awards flip7 with high cards", () => {
      expect(calculateScore([6, 7, 8, 9, 10, 11, 12], [], false).total).toBe(78);
    });

    it("flip7 + doubler", () => {
      const r = calculateScore([0, 1, 2, 3, 4, 5, 6], ["×2"], false);
      expect(r.total).toBe(57);
      expect(r.numberSum).toBe(21);
      expect(r.doubled).toBe(true);
      expect(r.flip7).toBe(true);
    });

    it("flip7 + doubler + bonus", () => {
      expect(calculateScore([0, 1, 2, 3, 4, 5, 6], ["+10", "×2"], false).total).toBe(67);
    });

    it("no flip7 for 6 cards", () => {
      const r = calculateScore([1, 2, 3, 4, 5, 6], [], false);
      expect(r.total).toBe(21);
      expect(r.flip7).toBe(false);
    });

    it("no flip7 for 8 cards", () => {
      const r = calculateScore([0, 1, 2, 3, 4, 5, 6, 7], [], false);
      expect(r.total).toBe(28);
      expect(r.flip7).toBe(false);
    });
  });

  describe("breakdown string", () => {
    it("shows basic sum", () => {
      expect(calculateScore([3, 5], [], false).breakdown).toBe("Cards: 8 = 8");
    });

    it("shows doubler in breakdown", () => {
      expect(calculateScore([3, 5], ["×2"], false).breakdown).toContain("×2");
    });

    it("shows bonus in breakdown", () => {
      expect(calculateScore([3], ["+4"], false).breakdown).toContain("+ 4 bonus");
    });

    it("shows flip7 in breakdown", () => {
      expect(calculateScore([0, 1, 2, 3, 4, 5, 6], [], false).breakdown).toContain("Flip 7!");
    });
  });
});
