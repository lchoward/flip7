import { initialState } from "./context/gameReducer";

export function numberCard(v) {
  return { type: "number", value: v };
}

export function modifierCard(v) {
  return { type: "modifier", value: v };
}

export function actionCard(v) {
  return { type: "action", value: v };
}

export function makeHand(overrides = {}) {
  return {
    numberCards: [],
    modifiers: [],
    actions: [],
    cancelledCards: [],
    status: "playing",
    hasSecondChance: false,
    ...overrides,
  };
}

export function makePlayRound(overrides = {}) {
  return {
    turnIndex: 0,
    turnOrder: [],
    playerHands: {},
    dealLog: [],
    pendingAction: null,
    ...overrides,
  };
}

export function makeGame(overrides = {}) {
  return {
    id: "test-game",
    players: [],
    rounds: [],
    createdAt: 1000,
    mode: "play",
    deck: [],
    dealerIndex: 0,
    playRound: null,
    tiebreaker: null,
    ...overrides,
  };
}

export function makeState(gameOverrides = {}, stateOverrides = {}) {
  return {
    ...initialState,
    loading: false,
    game: makeGame(gameOverrides),
    ...stateOverrides,
  };
}
