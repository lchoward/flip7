import { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from "react";
import { gameReducer, initialState, ACTIONS } from "./gameReducer";
import { loadGame, persistGame } from "./storage";
import { getPlayerTotal } from "../utils/helpers";
import { DECK, WIN_SCORE } from "../constants/deck";

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Load saved game on mount
  useEffect(() => {
    loadGame().then(saved => {
      if (saved) {
        dispatch({ type: ACTIONS.LOAD_GAME, payload: saved });
      }
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    });
  }, []);

  // Persist game whenever it changes
  useEffect(() => {
    if (state.game && !state.loading) {
      persistGame(state.game);
    }
  }, [state.game, state.loading]);

  // Sorted players by score (descending)
  const sortedPlayers = useMemo(() => {
    if (!state.game) return [];
    return [...state.game.players].sort(
      (a, b) => getPlayerTotal(state.game, b.id) - getPlayerTotal(state.game, a.id)
    );
  }, [state.game]);

  // Winner detection (tiebreaker-aware for play mode)
  const winner = useMemo(() => {
    if (!state.game || state.game.rounds.length === 0) return null;
    // In tiebreaker, no winner yet
    if (state.game.tiebreaker) return null;
    const top = sortedPlayers[0];
    if (!top) return null;
    const topScore = getPlayerTotal(state.game, top.id);
    if (topScore < WIN_SCORE) return null;
    // Check for tie at the top in play mode
    if (state.game.mode === "play" && sortedPlayers.length > 1) {
      const secondScore = getPlayerTotal(state.game, sortedPlayers[1].id);
      if (secondScore === topScore) return null; // Tie — no winner yet
    }
    return top;
  }, [state.game, sortedPlayers]);

  // Effective dealt cards (since last reshuffle)
  const getEffectiveDealtCards = useCallback(() => {
    if (!state.game) return null;
    const startRound = state.game.lastReshuffle || 0;
    const dealt = { numbers: {}, modifiers: {}, actions: {} };
    for (let i = 0; i <= 12; i++) dealt.numbers[i] = 0;
    Object.keys(DECK.modifiers).forEach(k => dealt.modifiers[k] = 0);
    Object.keys(DECK.actions).forEach(k => dealt.actions[k] = 0);

    for (let i = startRound; i < state.game.rounds.length; i++) {
      Object.values(state.game.rounds[i].playerResults).forEach(r => {
        (r.numberCards || []).forEach(c => { dealt.numbers[c] = (dealt.numbers[c] || 0) + 1; });
        (r.modifiers || []).forEach(m => { dealt.modifiers[m] = (dealt.modifiers[m] || 0) + 1; });
        (r.actions || []).forEach(a => { dealt.actions[a] = (dealt.actions[a] || 0) + 1; });
      });
    }

    // Include cards from the active play round
    if (state.game.playRound) {
      Object.values(state.game.playRound.playerHands).forEach(hand => {
        (hand.numberCards || []).forEach(c => { dealt.numbers[c] = (dealt.numbers[c] || 0) + 1; });
        (hand.modifiers || []).forEach(m => { dealt.modifiers[m] = (dealt.modifiers[m] || 0) + 1; });
        (hand.actions || []).forEach(a => { dealt.actions[a] = (dealt.actions[a] || 0) + 1; });
        // Count cancelled cards too (e.g. Second Chance bust cards) — they were dealt from the deck
        (hand.cancelledCards || []).forEach(c => {
          if (c.type === "number") dealt.numbers[c.value] = (dealt.numbers[c.value] || 0) + 1;
          else if (c.type === "modifier") dealt.modifiers[c.value] = (dealt.modifiers[c.value] || 0) + 1;
          else if (c.type === "action") dealt.actions[c.value] = (dealt.actions[c.value] || 0) + 1;
        });
      });
    }

    return dealt;
  }, [state.game]);

  const value = {
    ...state,
    dispatch,
    sortedPlayers,
    winner,
    getEffectiveDealtCards,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
