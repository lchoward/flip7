import { newGame } from "../utils/helpers";
import { playModeReducer } from "./reducers/playModeReducer";

export const ACTIONS = {
  SET_LOADING: "SET_LOADING",
  LOAD_GAME: "LOAD_GAME",
  SET_GAME: "SET_GAME",
  SAVE_ROUND: "SAVE_ROUND",
  RESET_DECK: "RESET_DECK",
  NAVIGATE: "NAVIGATE",
  TOGGLE_DECK: "TOGGLE_DECK",
  TOGGLE_CHEATER: "TOGGLE_CHEATER",
  START_NEW_GAME: "START_NEW_GAME",
  START_PLAY_ROUND: "START_PLAY_ROUND",
  PLAYER_HIT: "PLAYER_HIT",
  PLAYER_STAND: "PLAYER_STAND",
  END_PLAY_ROUND: "END_PLAY_ROUND",
  SET_TIEBREAKER: "SET_TIEBREAKER",
  CLEAR_TIEBREAKER: "CLEAR_TIEBREAKER",
  RESOLVE_FLIP_THREE: "RESOLVE_FLIP_THREE",
  RESOLVE_SECOND_CHANCE: "RESOLVE_SECOND_CHANCE",
  FLIP_THREE_DEAL_NEXT: "FLIP_THREE_DEAL_NEXT",
};

export const initialState = {
  game: null,
  screen: "home",
  selectedPlayer: null,
  editingRound: null,
  deckOpen: false,
  cheaterMode: false,
  loading: true,
};

const PLAY_MODE_ACTIONS = new Set([
  ACTIONS.START_PLAY_ROUND,
  ACTIONS.PLAYER_HIT,
  ACTIONS.PLAYER_STAND,
  ACTIONS.END_PLAY_ROUND,
  ACTIONS.SET_TIEBREAKER,
  ACTIONS.CLEAR_TIEBREAKER,
  ACTIONS.RESOLVE_FLIP_THREE,
  ACTIONS.RESOLVE_SECOND_CHANCE,
  ACTIONS.FLIP_THREE_DEAL_NEXT,
]);

export function gameReducer(state, action) {
  // Delegate play-mode actions to sub-reducer
  if (PLAY_MODE_ACTIONS.has(action.type)) {
    return playModeReducer(state, action);
  }

  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case ACTIONS.LOAD_GAME: {
      const loadedGame = action.payload;
      let loadScreen = "home";
      if (loadedGame.players.length > 0) {
        loadScreen = loadedGame.playRound ? "round" : "game";
      }
      return { ...state, game: loadedGame, screen: loadScreen };
    }

    case ACTIONS.SET_GAME:
      return { ...state, game: action.payload };

    case ACTIONS.SAVE_ROUND: {
      const { roundData, editingRound } = action.payload;
      const rounds = [...state.game.rounds];
      if (editingRound !== null) {
        rounds[editingRound] = roundData;
      } else {
        rounds.push(roundData);
      }
      return {
        ...state,
        game: { ...state.game, rounds },
        screen: "game",
        selectedPlayer: null,
        editingRound: null,
      };
    }

    case ACTIONS.RESET_DECK:
      return {
        ...state,
        game: { ...state.game, lastReshuffle: state.game.rounds.length },
      };

    case ACTIONS.NAVIGATE: {
      const { screen, editingRound, playerId } = action.payload;
      switch (screen) {
        case "home":
          return { ...state, screen: "home", selectedPlayer: null, editingRound: null };
        case "setup":
          return { ...state, screen: "setup" };
        case "game":
          return { ...state, screen: "game", selectedPlayer: null, editingRound: null };
        case "round":
          return { ...state, screen: "round", editingRound: editingRound ?? null, selectedPlayer: playerId ?? state.selectedPlayer };
        case "roundDetail":
          return { ...state, screen: "roundDetail", editingRound: editingRound ?? null, selectedPlayer: playerId ?? state.selectedPlayer };
        case "detail":
          return { ...state, screen: "detail", selectedPlayer: playerId };
        default:
          return state;
      }
    }

    case ACTIONS.TOGGLE_DECK:
      return { ...state, deckOpen: !state.deckOpen };

    case ACTIONS.TOGGLE_CHEATER:
      return { ...state, cheaterMode: !state.cheaterMode };

    case ACTIONS.START_NEW_GAME: {
      const g = newGame(action.payload?.mode);
      return { ...state, game: g, screen: "setup" };
    }

    default:
      return state;
  }
}
