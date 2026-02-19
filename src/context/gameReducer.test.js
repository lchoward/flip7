import { describe, it, expect } from "vitest";
import { gameReducer, ACTIONS, initialState } from "./gameReducer";
import {
  makeState, makeGame, makePlayRound, makeHand,
  numberCard, modifierCard, actionCard,
} from "../test-utils/helpers";

// ─── Simple State Actions ──────────────────────────────────

describe("SET_LOADING", () => {
  it("sets loading flag", () => {
    const state = gameReducer(initialState, { type: ACTIONS.SET_LOADING, payload: false });
    expect(state.loading).toBe(false);
  });
});

describe("NAVIGATE", () => {
  it("navigates to home and clears selection", () => {
    const state = makeState({}, { screen: "game", selectedPlayer: "p1", editingRound: 2 });
    const result = gameReducer(state, { type: ACTIONS.NAVIGATE, payload: { screen: "home" } });
    expect(result.screen).toBe("home");
    expect(result.selectedPlayer).toBeNull();
    expect(result.editingRound).toBeNull();
  });

  it("navigates to setup", () => {
    const result = gameReducer(makeState(), { type: ACTIONS.NAVIGATE, payload: { screen: "setup" } });
    expect(result.screen).toBe("setup");
  });

  it("navigates to game and clears selection", () => {
    const state = makeState({}, { selectedPlayer: "p1", editingRound: 1 });
    const result = gameReducer(state, { type: ACTIONS.NAVIGATE, payload: { screen: "game" } });
    expect(result.screen).toBe("game");
    expect(result.selectedPlayer).toBeNull();
    expect(result.editingRound).toBeNull();
  });

  it("navigates to round with editing info", () => {
    const result = gameReducer(makeState(), {
      type: ACTIONS.NAVIGATE, payload: { screen: "round", editingRound: 3, playerId: "p1" },
    });
    expect(result.screen).toBe("round");
    expect(result.editingRound).toBe(3);
    expect(result.selectedPlayer).toBe("p1");
  });

  it("navigates to detail with player", () => {
    const result = gameReducer(makeState(), {
      type: ACTIONS.NAVIGATE, payload: { screen: "detail", playerId: "p2" },
    });
    expect(result.screen).toBe("detail");
    expect(result.selectedPlayer).toBe("p2");
  });

  it("returns state for unknown screen", () => {
    const state = makeState();
    const result = gameReducer(state, { type: ACTIONS.NAVIGATE, payload: { screen: "nonexistent" } });
    expect(result).toBe(state);
  });
});

describe("TOGGLE_DECK", () => {
  it("toggles deckOpen", () => {
    const state = makeState({}, { deckOpen: false });
    expect(gameReducer(state, { type: ACTIONS.TOGGLE_DECK }).deckOpen).toBe(true);
    expect(gameReducer(gameReducer(state, { type: ACTIONS.TOGGLE_DECK }), { type: ACTIONS.TOGGLE_DECK }).deckOpen).toBe(false);
  });
});

describe("TOGGLE_CHEATER", () => {
  it("toggles cheaterMode", () => {
    const state = makeState({}, { cheaterMode: false });
    expect(gameReducer(state, { type: ACTIONS.TOGGLE_CHEATER }).cheaterMode).toBe(true);
  });
});

// ─── LOAD_GAME ──────────────────────────────────

describe("LOAD_GAME", () => {
  it("goes to home when no players", () => {
    const game = makeGame({ players: [] });
    const result = gameReducer(initialState, { type: ACTIONS.LOAD_GAME, payload: game });
    expect(result.screen).toBe("home");
    expect(result.game).toBe(game);
  });

  it("goes to game when players exist but no playRound", () => {
    const game = makeGame({ players: [{ id: "p1" }], playRound: null });
    const result = gameReducer(initialState, { type: ACTIONS.LOAD_GAME, payload: game });
    expect(result.screen).toBe("game");
  });

  it("goes to round when playRound is in progress", () => {
    const game = makeGame({
      players: [{ id: "p1" }],
      playRound: makePlayRound({ turnOrder: ["p1"] }),
    });
    const result = gameReducer(initialState, { type: ACTIONS.LOAD_GAME, payload: game });
    expect(result.screen).toBe("round");
  });
});

// ─── START_NEW_GAME ──────────────────────────────────

describe("START_NEW_GAME", () => {
  it("creates play game by default", () => {
    const result = gameReducer(makeState(), { type: ACTIONS.START_NEW_GAME, payload: {} });
    expect(result.game.mode).toBe("play");
    expect(result.screen).toBe("setup");
  });

  it("creates play game when specified", () => {
    const result = gameReducer(makeState(), { type: ACTIONS.START_NEW_GAME, payload: { mode: "play" } });
    expect(result.game.mode).toBe("play");
    expect(result.game.deck).toEqual([]);
    expect(result.game.dealerIndex).toBe(0);
    expect(result.game.playRound).toBeNull();
    expect(result.game.tiebreaker).toBeNull();
  });
});

// ─── Score Tracker Actions ──────────────────────────────────

describe("SAVE_ROUND", () => {
  it("appends new round", () => {
    const state = makeState({ rounds: [] });
    const roundData = { roundNumber: 1, playerResults: { p1: { score: 10 } } };
    const result = gameReducer(state, {
      type: ACTIONS.SAVE_ROUND,
      payload: { roundData, editingRound: null },
    });
    expect(result.game.rounds).toHaveLength(1);
    expect(result.game.rounds[0]).toEqual(roundData);
    expect(result.screen).toBe("game");
  });

  it("replaces existing round when editing", () => {
    const existingRound = { roundNumber: 1, playerResults: { p1: { score: 5 } } };
    const state = makeState({ rounds: [existingRound] });
    const updatedRound = { roundNumber: 1, playerResults: { p1: { score: 20 } } };
    const result = gameReducer(state, {
      type: ACTIONS.SAVE_ROUND,
      payload: { roundData: updatedRound, editingRound: 0 },
    });
    expect(result.game.rounds).toHaveLength(1);
    expect(result.game.rounds[0].playerResults.p1.score).toBe(20);
  });
});

describe("RESET_DECK", () => {
  it("sets lastReshuffle to current round count", () => {
    const state = makeState({ rounds: [1, 2, 3] });
    const result = gameReducer(state, { type: ACTIONS.RESET_DECK });
    expect(result.game.lastReshuffle).toBe(3);
  });
});

// ─── Play Mode — START_PLAY_ROUND ──────────────────────────────────

describe("START_PLAY_ROUND", () => {
  it("sets up turn order from dealerIndex+1 wrapping around", () => {
    const state = makeState({
      players: [{ id: "a" }, { id: "b" }, { id: "c" }],
      dealerIndex: 1,
      deck: [numberCard(3), numberCard(5), numberCard(7)],
    });
    const result = gameReducer(state, { type: ACTIONS.START_PLAY_ROUND });
    expect(result.game.playRound.turnOrder).toEqual(["c", "a", "b"]);
  });

  it("initializes empty hands for all players", () => {
    const state = makeState({
      players: [{ id: "a" }, { id: "b" }],
      dealerIndex: 0,
      deck: [numberCard(1)],
    });
    const result = gameReducer(state, { type: ACTIONS.START_PLAY_ROUND });
    const hands = result.game.playRound.playerHands;
    expect(hands["a"].numberCards).toEqual([]);
    expect(hands["b"].numberCards).toEqual([]);
    expect(hands["a"].status).toBe("playing");
    expect(hands["b"].status).toBe("playing");
  });

  it("filters to tiebreaker players when tiebreaker is active", () => {
    const state = makeState({
      players: [{ id: "a" }, { id: "b" }, { id: "c" }],
      dealerIndex: 0,
      tiebreaker: { playerIds: ["a", "c"], startedAtRound: 2 },
      deck: [numberCard(1)],
    });
    const result = gameReducer(state, { type: ACTIONS.START_PLAY_ROUND });
    expect(result.game.playRound.turnOrder).toEqual(["c", "a"]);
    expect(result.game.playRound.playerHands["b"]).toBeUndefined();
  });

  it("creates a shuffled deck when deck is empty", () => {
    const state = makeState({
      players: [{ id: "a" }],
      dealerIndex: 0,
      deck: [],
    });
    const result = gameReducer(state, { type: ACTIONS.START_PLAY_ROUND });
    expect(result.game.deck.length).toBe(94);
  });

  it("sets screen to round", () => {
    const state = makeState({
      players: [{ id: "a" }],
      dealerIndex: 0,
      deck: [numberCard(1)],
    });
    const result = gameReducer(state, { type: ACTIONS.START_PLAY_ROUND });
    expect(result.screen).toBe("round");
  });
});

// ─── Play Mode — PLAYER_HIT ──────────────────────────────────

describe("PLAYER_HIT", () => {
  function hitState(deck, hands, turnIndex = 0, turnOrder = ["p1", "p2"]) {
    return makeState({
      players: turnOrder.map(id => ({ id })),
      deck,
      playRound: makePlayRound({
        turnIndex,
        turnOrder,
        playerHands: hands,
      }),
    });
  }

  describe("number cards", () => {
    it("adds number card to hand and advances turn", () => {
      const state = hitState(
        [numberCard(5), numberCard(7)],
        { p1: makeHand(), p2: makeHand() },
      );
      const result = gameReducer(state, { type: ACTIONS.PLAYER_HIT });
      expect(result.game.playRound.playerHands.p1.numberCards).toEqual([5]);
      expect(result.game.playRound.turnIndex).toBe(1); // advanced to p2
      expect(result.game.deck).toHaveLength(1);
    });

    it("busts player on duplicate number", () => {
      const state = hitState(
        [numberCard(3)],
        { p1: makeHand({ numberCards: [3] }), p2: makeHand() },
      );
      const result = gameReducer(state, { type: ACTIONS.PLAYER_HIT });
      expect(result.game.playRound.playerHands.p1.status).toBe("busted");
      expect(result.game.playRound.playerHands.p1.numberCards).toEqual([3, 3]);
    });

    it("Second Chance saves from bust", () => {
      const state = hitState(
        [numberCard(3)],
        {
          p1: makeHand({
            numberCards: [3],
            hasSecondChance: true,
            actions: ["Second Chance"],
          }),
          p2: makeHand(),
        },
      );
      const result = gameReducer(state, { type: ACTIONS.PLAYER_HIT });
      const hand = result.game.playRound.playerHands.p1;
      expect(hand.status).toBe("playing");
      expect(hand.numberCards).toEqual([3]); // duplicate removed
      expect(hand.hasSecondChance).toBe(false);
      expect(hand.cancelledCards).toHaveLength(2); // number + action card
    });

    it("auto-stands player at 7 unique numbers", () => {
      const state = hitState(
        [numberCard(7)],
        { p1: makeHand({ numberCards: [0, 1, 2, 3, 4, 5] }), p2: makeHand() },
      );
      const result = gameReducer(state, { type: ACTIONS.PLAYER_HIT });
      expect(result.game.playRound.playerHands.p1.status).toBe("stood");
      expect(result.game.playRound.playerHands.p1.numberCards).toHaveLength(7);
    });
  });

  describe("modifier cards", () => {
    it("adds modifier to hand", () => {
      const state = hitState(
        [modifierCard("+4")],
        { p1: makeHand(), p2: makeHand() },
      );
      const result = gameReducer(state, { type: ACTIONS.PLAYER_HIT });
      expect(result.game.playRound.playerHands.p1.modifiers).toEqual(["+4"]);
    });
  });

  describe("Freeze action", () => {
    it("freezes the player", () => {
      const state = hitState(
        [actionCard("Freeze")],
        { p1: makeHand(), p2: makeHand() },
      );
      const result = gameReducer(state, { type: ACTIONS.PLAYER_HIT });
      expect(result.game.playRound.playerHands.p1.status).toBe("frozen");
      expect(result.game.playRound.playerHands.p1.actions).toEqual(["Freeze"]);
    });
  });

  describe("Second Chance action", () => {
    it("grants shield on first Second Chance", () => {
      const state = hitState(
        [actionCard("Second Chance")],
        { p1: makeHand(), p2: makeHand() },
      );
      const result = gameReducer(state, { type: ACTIONS.PLAYER_HIT });
      expect(result.game.playRound.playerHands.p1.hasSecondChance).toBe(true);
      expect(result.game.playRound.playerHands.p1.actions).toEqual(["Second Chance"]);
      // Normal advance
      expect(result.game.playRound.turnIndex).toBe(1);
    });

    it("shows gift UI on duplicate Second Chance with eligible players", () => {
      const state = hitState(
        [actionCard("Second Chance")],
        {
          p1: makeHand({ hasSecondChance: true, actions: ["Second Chance"] }),
          p2: makeHand(),
        },
      );
      const result = gameReducer(state, { type: ACTIONS.PLAYER_HIT });
      expect(result.game.playRound.pendingAction.type).toBe("second_chance_gift");
      expect(result.game.playRound.pendingAction.eligiblePlayerIds).toEqual(["p2"]);
    });

    it("discards duplicate Second Chance when no eligible players", () => {
      const state = hitState(
        [actionCard("Second Chance")],
        {
          p1: makeHand({ hasSecondChance: true, actions: ["Second Chance"] }),
          p2: makeHand({ hasSecondChance: true }),
        },
      );
      const result = gameReducer(state, { type: ACTIONS.PLAYER_HIT });
      expect(result.game.playRound.pendingAction).toBeNull();
      // Turn should advance
      expect(result.game.playRound.turnIndex).toBe(1);
    });
  });

  describe("Flip Three action", () => {
    it("shows target selection when multiple players are playing", () => {
      const state = hitState(
        [actionCard("Flip Three")],
        { p1: makeHand(), p2: makeHand() },
      );
      const result = gameReducer(state, { type: ACTIONS.PLAYER_HIT });
      expect(result.game.playRound.pendingAction.type).toBe("flip_three_target");
      expect(result.game.playRound.pendingAction.sourcePlayerId).toBe("p1");
    });

    it("auto-targets self when only player left", () => {
      const state = hitState(
        [actionCard("Flip Three"), numberCard(1), numberCard(2), numberCard(3)],
        {
          p1: makeHand(),
          p2: makeHand({ status: "busted" }),
        },
      );
      const result = gameReducer(state, { type: ACTIONS.PLAYER_HIT });
      // Auto-deals first card immediately, sets up staggered dealing for remaining 2
      const pending = result.game.playRound.pendingAction;
      expect(pending.type).toBe("flip_three_dealing");
      expect(pending.targetPlayerId).toBe("p1");
      expect(pending.remaining).toBe(2);
    });
  });

  describe("turn advancement", () => {
    it("wraps around to first player", () => {
      const state = hitState(
        [numberCard(5)],
        { p1: makeHand(), p2: makeHand() },
        1, // p2's turn
      );
      const result = gameReducer(state, { type: ACTIONS.PLAYER_HIT });
      expect(result.game.playRound.turnIndex).toBe(0); // wraps to p1
    });

    it("skips busted players", () => {
      const state = hitState(
        [numberCard(5)],
        { p1: makeHand(), p2: makeHand({ status: "busted" }), p3: makeHand() },
        0,
        ["p1", "p2", "p3"],
      );
      const result = gameReducer(state, { type: ACTIONS.PLAYER_HIT });
      expect(result.game.playRound.turnIndex).toBe(2); // skips p2
    });

    it("stays at turnIndex when all others are done", () => {
      const state = hitState(
        [numberCard(5)],
        { p1: makeHand(), p2: makeHand({ status: "stood" }) },
      );
      const result = gameReducer(state, { type: ACTIONS.PLAYER_HIT });
      // p1 gets a card, p2 is stood, only p1 is playing — turnIndex stays at 0
      expect(result.game.playRound.turnIndex).toBe(0);
    });
  });

  describe("deal log", () => {
    it("records card deals", () => {
      const state = hitState(
        [numberCard(5)],
        { p1: makeHand(), p2: makeHand() },
      );
      const result = gameReducer(state, { type: ACTIONS.PLAYER_HIT });
      expect(result.game.playRound.dealLog).toHaveLength(1);
      expect(result.game.playRound.dealLog[0].playerId).toBe("p1");
      expect(result.game.playRound.dealLog[0].card).toEqual(numberCard(5));
      expect(result.game.playRound.dealLog[0].event).toBe("deal");
    });

    it("records bust event", () => {
      const state = hitState(
        [numberCard(3)],
        { p1: makeHand({ numberCards: [3] }), p2: makeHand() },
      );
      const result = gameReducer(state, { type: ACTIONS.PLAYER_HIT });
      const bustLog = result.game.playRound.dealLog.find(e => e.event === "bust");
      expect(bustLog).toBeDefined();
      expect(bustLog.playerId).toBe("p1");
    });

    it("records second_chance_save event", () => {
      const state = hitState(
        [numberCard(3)],
        {
          p1: makeHand({ numberCards: [3], hasSecondChance: true, actions: ["Second Chance"] }),
          p2: makeHand(),
        },
      );
      const result = gameReducer(state, { type: ACTIONS.PLAYER_HIT });
      const saveLog = result.game.playRound.dealLog.find(e => e.event === "second_chance_save");
      expect(saveLog).toBeDefined();
    });
  });
});

// ─── Play Mode — PLAYER_STAND ──────────────────────────────────

describe("PLAYER_STAND", () => {
  it("sets player status to stood and advances turn", () => {
    const state = makeState({
      players: [{ id: "p1" }, { id: "p2" }],
      deck: [],
      playRound: makePlayRound({
        turnIndex: 0,
        turnOrder: ["p1", "p2"],
        playerHands: { p1: makeHand(), p2: makeHand() },
      }),
    });
    const result = gameReducer(state, { type: ACTIONS.PLAYER_STAND });
    expect(result.game.playRound.playerHands.p1.status).toBe("stood");
    expect(result.game.playRound.turnIndex).toBe(1);
  });

  it("stays at turnIndex when all players are done", () => {
    const state = makeState({
      players: [{ id: "p1" }, { id: "p2" }],
      deck: [],
      playRound: makePlayRound({
        turnIndex: 0,
        turnOrder: ["p1", "p2"],
        playerHands: {
          p1: makeHand(),
          p2: makeHand({ status: "busted" }),
        },
      }),
    });
    const result = gameReducer(state, { type: ACTIONS.PLAYER_STAND });
    expect(result.game.playRound.playerHands.p1.status).toBe("stood");
    // No playing players left, turnIndex stays
    expect(result.game.playRound.turnIndex).toBe(0);
  });
});

// ─── RESOLVE_FLIP_THREE ──────────────────────────────────

describe("RESOLVE_FLIP_THREE", () => {
  it("deals first card to target and sets up staggered dealing", () => {
    const state = makeState({
      players: [{ id: "p1" }, { id: "p2" }],
      deck: [numberCard(1), numberCard(2), numberCard(3)],
      playRound: makePlayRound({
        turnIndex: 0,
        turnOrder: ["p1", "p2"],
        playerHands: { p1: makeHand(), p2: makeHand() },
        pendingAction: {
          type: "flip_three_target",
          sourcePlayerId: "p1",
          chooserId: "p1",
          flipThreeQueue: [],
        },
      }),
    });
    const result = gameReducer(state, {
      type: ACTIONS.RESOLVE_FLIP_THREE,
      payload: { targetPlayerId: "p2" },
    });
    expect(result.game.playRound.playerHands.p2.numberCards).toEqual([1]);
    expect(result.game.playRound.pendingAction.type).toBe("flip_three_dealing");
    expect(result.game.playRound.pendingAction.remaining).toBe(2);
    expect(result.game.deck).toHaveLength(2);
  });

  it("finishes immediately if target busts on first card", () => {
    const state = makeState({
      players: [{ id: "p1" }, { id: "p2" }],
      deck: [numberCard(5), numberCard(2), numberCard(3)],
      playRound: makePlayRound({
        turnIndex: 0,
        turnOrder: ["p1", "p2"],
        playerHands: {
          p1: makeHand(),
          p2: makeHand({ numberCards: [5] }),
        },
        pendingAction: {
          type: "flip_three_target",
          sourcePlayerId: "p1",
          chooserId: "p1",
          flipThreeQueue: [],
        },
      }),
    });
    const result = gameReducer(state, {
      type: ACTIONS.RESOLVE_FLIP_THREE,
      payload: { targetPlayerId: "p2" },
    });
    expect(result.game.playRound.playerHands.p2.status).toBe("busted");
    expect(result.game.playRound.pendingAction).toBeNull(); // no more dealing
  });

  it("finishes immediately if target freezes on first card", () => {
    const state = makeState({
      players: [{ id: "p1" }, { id: "p2" }],
      deck: [actionCard("Freeze"), numberCard(2), numberCard(3)],
      playRound: makePlayRound({
        turnIndex: 0,
        turnOrder: ["p1", "p2"],
        playerHands: { p1: makeHand(), p2: makeHand() },
        pendingAction: {
          type: "flip_three_target",
          sourcePlayerId: "p1",
          chooserId: "p1",
          flipThreeQueue: [],
        },
      }),
    });
    const result = gameReducer(state, {
      type: ACTIONS.RESOLVE_FLIP_THREE,
      payload: { targetPlayerId: "p2" },
    });
    expect(result.game.playRound.playerHands.p2.status).toBe("frozen");
    expect(result.game.playRound.pendingAction).toBeNull();
  });
});

// ─── FLIP_THREE_DEAL_NEXT ──────────────────────────────────

describe("FLIP_THREE_DEAL_NEXT", () => {
  it("deals next card and decrements remaining", () => {
    const state = makeState({
      players: [{ id: "p1" }, { id: "p2" }],
      deck: [numberCard(2), numberCard(3)],
      playRound: makePlayRound({
        turnIndex: 0,
        turnOrder: ["p1", "p2"],
        playerHands: { p1: makeHand(), p2: makeHand({ numberCards: [1] }) },
        pendingAction: {
          type: "flip_three_dealing",
          targetPlayerId: "p2",
          remaining: 2,
          sourcePlayerId: "p1",
          flipThreeQueue: [],
        },
      }),
    });
    const result = gameReducer(state, { type: ACTIONS.FLIP_THREE_DEAL_NEXT });
    expect(result.game.playRound.playerHands.p2.numberCards).toEqual([1, 2]);
    expect(result.game.playRound.pendingAction.remaining).toBe(1);
  });

  it("clears pending when all cards dealt", () => {
    const state = makeState({
      players: [{ id: "p1" }, { id: "p2" }],
      deck: [numberCard(3)],
      playRound: makePlayRound({
        turnIndex: 0,
        turnOrder: ["p1", "p2"],
        playerHands: { p1: makeHand(), p2: makeHand({ numberCards: [1, 2] }) },
        pendingAction: {
          type: "flip_three_dealing",
          targetPlayerId: "p2",
          remaining: 1,
          sourcePlayerId: "p1",
          flipThreeQueue: [],
        },
      }),
    });
    const result = gameReducer(state, { type: ACTIONS.FLIP_THREE_DEAL_NEXT });
    expect(result.game.playRound.pendingAction).toBeNull();
    expect(result.game.playRound.playerHands.p2.numberCards).toEqual([1, 2, 3]);
  });

  it("stops early if target busts", () => {
    const state = makeState({
      players: [{ id: "p1" }, { id: "p2" }],
      deck: [numberCard(1), numberCard(9)], // 1 will bust p2
      playRound: makePlayRound({
        turnIndex: 0,
        turnOrder: ["p1", "p2"],
        playerHands: { p1: makeHand(), p2: makeHand({ numberCards: [1, 2] }) },
        pendingAction: {
          type: "flip_three_dealing",
          targetPlayerId: "p2",
          remaining: 2,
          sourcePlayerId: "p1",
          flipThreeQueue: [],
        },
      }),
    });
    const result = gameReducer(state, { type: ACTIONS.FLIP_THREE_DEAL_NEXT });
    expect(result.game.playRound.playerHands.p2.status).toBe("busted");
    expect(result.game.playRound.pendingAction).toBeNull();
  });

  it("returns state unchanged if no pending flip_three_dealing", () => {
    const state = makeState({
      playRound: makePlayRound({ pendingAction: null }),
    });
    const result = gameReducer(state, { type: ACTIONS.FLIP_THREE_DEAL_NEXT });
    expect(result).toBe(state);
  });

  it("queues chained Flip Three during dealing", () => {
    const state = makeState({
      players: [{ id: "p1" }, { id: "p2" }],
      deck: [actionCard("Flip Three"), numberCard(9)],
      playRound: makePlayRound({
        turnIndex: 0,
        turnOrder: ["p1", "p2"],
        playerHands: { p1: makeHand(), p2: makeHand({ numberCards: [1] }) },
        pendingAction: {
          type: "flip_three_dealing",
          targetPlayerId: "p2",
          remaining: 1,
          sourcePlayerId: "p1",
          flipThreeQueue: [],
        },
      }),
    });
    const result = gameReducer(state, { type: ACTIONS.FLIP_THREE_DEAL_NEXT });
    // The Flip Three drawn during dealing should be queued and processed
    const pending = result.game.playRound.pendingAction;
    expect(pending).not.toBeNull();
    expect(pending.type).toBe("flip_three_target");
    expect(pending.chooserId).toBe("p2");
  });
});

// ─── RESOLVE_SECOND_CHANCE ──────────────────────────────────

describe("RESOLVE_SECOND_CHANCE", () => {
  it("transfers Second Chance from source to target", () => {
    const state = makeState({
      players: [{ id: "p1" }, { id: "p2" }],
      deck: [],
      playRound: makePlayRound({
        turnIndex: 0,
        turnOrder: ["p1", "p2"],
        playerHands: {
          p1: makeHand({ hasSecondChance: true, actions: ["Second Chance", "Second Chance"] }),
          p2: makeHand(),
        },
        pendingAction: {
          type: "second_chance_gift",
          sourcePlayerId: "p1",
          eligiblePlayerIds: ["p2"],
          flipThreeQueue: [],
        },
      }),
    });
    const result = gameReducer(state, {
      type: ACTIONS.RESOLVE_SECOND_CHANCE,
      payload: { targetPlayerId: "p2" },
    });
    expect(result.game.playRound.playerHands.p2.hasSecondChance).toBe(true);
    expect(result.game.playRound.playerHands.p2.actions).toContain("Second Chance");
    // Source should have one fewer Second Chance action
    expect(result.game.playRound.playerHands.p1.actions).toEqual(["Second Chance"]);
    expect(result.game.playRound.pendingAction).toBeNull();
  });
});

// ─── Play Mode — END_PLAY_ROUND ──────────────────────────────────

describe("END_PLAY_ROUND", () => {
  it("calculates scores and creates round data", () => {
    const state = makeState({
      players: [{ id: "p1" }, { id: "p2" }],
      rounds: [],
      dealerIndex: 0,
      playRound: makePlayRound({
        turnOrder: ["p1", "p2"],
        playerHands: {
          p1: makeHand({ numberCards: [3, 5, 7], modifiers: ["+4"], status: "stood" }),
          p2: makeHand({ numberCards: [3, 3], status: "busted" }),
        },
        dealLog: [{ playerId: "p1", card: numberCard(3), event: "deal" }],
      }),
    });
    const result = gameReducer(state, { type: ACTIONS.END_PLAY_ROUND });
    expect(result.game.rounds).toHaveLength(1);
    const round = result.game.rounds[0];
    expect(round.roundNumber).toBe(1);
    expect(round.playerResults.p1.score).toBe(19); // 3+5+7+4
    expect(round.playerResults.p1.busted).toBe(false);
    expect(round.playerResults.p2.score).toBe(0);
    expect(round.playerResults.p2.busted).toBe(true);
  });

  it("rotates dealer index", () => {
    const state = makeState({
      players: [{ id: "p1" }, { id: "p2" }, { id: "p3" }],
      rounds: [],
      dealerIndex: 1,
      playRound: makePlayRound({
        turnOrder: ["p1", "p2", "p3"],
        playerHands: {
          p1: makeHand({ status: "stood" }),
          p2: makeHand({ status: "stood" }),
          p3: makeHand({ status: "stood" }),
        },
      }),
    });
    const result = gameReducer(state, { type: ACTIONS.END_PLAY_ROUND });
    expect(result.game.dealerIndex).toBe(2);
  });

  it("wraps dealer index around", () => {
    const state = makeState({
      players: [{ id: "p1" }, { id: "p2" }],
      rounds: [],
      dealerIndex: 1,
      playRound: makePlayRound({
        turnOrder: ["p1", "p2"],
        playerHands: {
          p1: makeHand({ status: "stood" }),
          p2: makeHand({ status: "stood" }),
        },
      }),
    });
    const result = gameReducer(state, { type: ACTIONS.END_PLAY_ROUND });
    expect(result.game.dealerIndex).toBe(0);
  });

  it("clears playRound and goes to game screen", () => {
    const state = makeState({
      players: [{ id: "p1" }],
      rounds: [],
      dealerIndex: 0,
      playRound: makePlayRound({
        turnOrder: ["p1"],
        playerHands: { p1: makeHand({ status: "stood" }) },
      }),
    });
    const result = gameReducer(state, { type: ACTIONS.END_PLAY_ROUND });
    expect(result.game.playRound).toBeNull();
    expect(result.screen).toBe("game");
  });

  it("gives 0 score to players not in tiebreaker round", () => {
    const state = makeState({
      players: [{ id: "p1" }, { id: "p2" }, { id: "p3" }],
      rounds: [],
      dealerIndex: 0,
      playRound: makePlayRound({
        turnOrder: ["p1", "p3"],
        playerHands: {
          p1: makeHand({ numberCards: [5], status: "stood" }),
          p3: makeHand({ numberCards: [10], status: "stood" }),
        },
      }),
    });
    const result = gameReducer(state, { type: ACTIONS.END_PLAY_ROUND });
    expect(result.game.rounds[0].playerResults.p2.score).toBe(0);
  });

  it("merges cancelledCards back into round results for deck tracking", () => {
    const state = makeState({
      players: [{ id: "p1" }],
      rounds: [],
      dealerIndex: 0,
      playRound: makePlayRound({
        turnOrder: ["p1"],
        playerHands: {
          p1: makeHand({
            numberCards: [3],
            cancelledCards: [
              { type: "number", value: 5 },
              { type: "action", value: "Second Chance" },
            ],
            status: "stood",
          }),
        },
      }),
    });
    const result = gameReducer(state, { type: ACTIONS.END_PLAY_ROUND });
    const p1Result = result.game.rounds[0].playerResults.p1;
    expect(p1Result.numberCards).toEqual([3, 5]);
    expect(p1Result.actions).toEqual(["Second Chance"]);
  });
});

// ─── Tiebreaker Actions ──────────────────────────────────

describe("SET_TIEBREAKER", () => {
  it("sets tiebreaker with player ids and current round count", () => {
    const state = makeState({ rounds: [{}, {}, {}] });
    const result = gameReducer(state, {
      type: ACTIONS.SET_TIEBREAKER,
      payload: { playerIds: ["p1", "p3"] },
    });
    expect(result.game.tiebreaker.playerIds).toEqual(["p1", "p3"]);
    expect(result.game.tiebreaker.startedAtRound).toBe(3);
  });
});

describe("CLEAR_TIEBREAKER", () => {
  it("clears tiebreaker", () => {
    const state = makeState({ tiebreaker: { playerIds: ["p1"], startedAtRound: 2 } });
    const result = gameReducer(state, { type: ACTIONS.CLEAR_TIEBREAKER });
    expect(result.game.tiebreaker).toBeNull();
  });
});

// ─── Integration Test ──────────────────────────────────

describe("full round integration", () => {
  it("plays a complete round: start → hits → stands → end", () => {
    // Set up a game with 3 players, known deck
    const state = makeState({
      players: [{ id: "a" }, { id: "b" }, { id: "c" }],
      dealerIndex: 0,
      rounds: [],
      deck: [
        // Round-robin: b, c, a, b, c, a...
        // Turn 1: b hits → gets 3
        numberCard(3),
        // Turn 2: c hits → gets 5
        numberCard(5),
        // Turn 3: a hits → gets 7
        numberCard(7),
        // Turn 4: b hits → gets +4 modifier
        modifierCard("+4"),
        // Turn 5: c hits → gets 5 again → busts!
        numberCard(5),
        // Turn 6: a hits → gets 10
        numberCard(10),
        // Remaining cards for any additional draws
        numberCard(1), numberCard(2),
      ],
    });

    // Start round (dealer is 'a' index 0, so turn order starts from b)
    let s = gameReducer(state, { type: ACTIONS.START_PLAY_ROUND });
    expect(s.game.playRound.turnOrder).toEqual(["b", "c", "a"]);
    expect(s.game.playRound.turnIndex).toBe(0); // b's turn

    // b hits → gets 3
    s = gameReducer(s, { type: ACTIONS.PLAYER_HIT });
    expect(s.game.playRound.playerHands.b.numberCards).toEqual([3]);
    expect(s.game.playRound.turnIndex).toBe(1); // c's turn

    // c hits → gets 5
    s = gameReducer(s, { type: ACTIONS.PLAYER_HIT });
    expect(s.game.playRound.playerHands.c.numberCards).toEqual([5]);
    expect(s.game.playRound.turnIndex).toBe(2); // a's turn

    // a hits → gets 7
    s = gameReducer(s, { type: ACTIONS.PLAYER_HIT });
    expect(s.game.playRound.playerHands.a.numberCards).toEqual([7]);
    expect(s.game.playRound.turnIndex).toBe(0); // b's turn

    // b hits → gets +4 modifier
    s = gameReducer(s, { type: ACTIONS.PLAYER_HIT });
    expect(s.game.playRound.playerHands.b.modifiers).toEqual(["+4"]);
    expect(s.game.playRound.turnIndex).toBe(1); // c's turn

    // c hits → gets 5 (duplicate!) → busts
    s = gameReducer(s, { type: ACTIONS.PLAYER_HIT });
    expect(s.game.playRound.playerHands.c.status).toBe("busted");
    expect(s.game.playRound.turnIndex).toBe(2); // a's turn (c skipped)

    // a hits → gets 10
    s = gameReducer(s, { type: ACTIONS.PLAYER_HIT });
    expect(s.game.playRound.playerHands.a.numberCards).toEqual([7, 10]);
    expect(s.game.playRound.turnIndex).toBe(0); // b's turn

    // b stands
    s = gameReducer(s, { type: ACTIONS.PLAYER_STAND });
    expect(s.game.playRound.playerHands.b.status).toBe("stood");
    expect(s.game.playRound.turnIndex).toBe(2); // a's turn (c busted, b stood)

    // a stands
    s = gameReducer(s, { type: ACTIONS.PLAYER_STAND });
    expect(s.game.playRound.playerHands.a.status).toBe("stood");

    // End round
    s = gameReducer(s, { type: ACTIONS.END_PLAY_ROUND });
    expect(s.game.rounds).toHaveLength(1);
    const results = s.game.rounds[0].playerResults;

    // a: 7 + 10 = 17
    expect(results.a.score).toBe(17);
    expect(results.a.busted).toBe(false);

    // b: 3 + 4 (modifier) = 7
    expect(results.b.score).toBe(7);
    expect(results.b.busted).toBe(false);

    // c: busted = 0
    expect(results.c.score).toBe(0);
    expect(results.c.busted).toBe(true);

    // Dealer rotated
    expect(s.game.dealerIndex).toBe(1);
    expect(s.game.playRound).toBeNull();
    expect(s.screen).toBe("game");
  });
});
