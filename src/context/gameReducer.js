import { newGame } from "../utils/helpers";
import { createShuffledDeck } from "../utils/deckBuilder";
import { calculateScore, hasDuplicateNumbers } from "../utils/scoring";

export const ACTIONS = {
  SET_LOADING: "SET_LOADING",
  LOAD_GAME: "LOAD_GAME",
  SET_GAME: "SET_GAME",
  SAVE_ROUND: "SAVE_ROUND",
  RESET_DECK: "RESET_DECK",
  NAVIGATE: "NAVIGATE",
  SET_DIALOG: "SET_DIALOG",
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
  dialog: null,
  deckOpen: false,
  cheaterMode: false,
  loading: true,
};

function ensureDeck(deck) {
  if (deck.length > 0) return { deck, reshuffled: false };
  return { deck: createShuffledDeck(), reshuffled: true };
}

function findNextPlayingIndex(turnOrder, playerHands, afterIndex) {
  for (let i = 1; i <= turnOrder.length; i++) {
    const idx = (afterIndex + i) % turnOrder.length;
    if (playerHands[turnOrder[idx]].status === "playing") return idx;
  }
  return -1;
}

// Deals exactly one card. Returns pendingType to signal if UI interaction is needed.
function dealOneCard(deck, hand, playerId, dealLog) {
  const { deck: newDeck, reshuffled } = ensureDeck(deck);
  const [card, ...rest] = newDeck;
  const newHand = { ...hand };
  const newLog = [...dealLog];
  let pendingType = null;

  if (card.type === "number") {
    newHand.numberCards = [...newHand.numberCards, card.value];
    newLog.push({ playerId, card, event: "deal" });

    if (hasDuplicateNumbers(newHand.numberCards)) {
      if (newHand.hasSecondChance) {
        const removedNumber = newHand.numberCards[newHand.numberCards.length - 1];
        newHand.numberCards = newHand.numberCards.slice(0, -1);
        newHand.hasSecondChance = false;
        // Remove one "Second Chance" from actions (consumed)
        const scIdx = newHand.actions.indexOf("Second Chance");
        if (scIdx !== -1) {
          newHand.actions = [...newHand.actions];
          newHand.actions.splice(scIdx, 1);
        }
        // Track both cancelled cards for visibility
        newHand.cancelledCards = [
          ...(newHand.cancelledCards || []),
          { type: "number", value: removedNumber },
          { type: "action", value: "Second Chance" },
        ];
        newLog.push({ playerId, card, event: "second_chance_save" });
      } else {
        newHand.status = "busted";
        newLog.push({ playerId, card, event: "bust" });
      }
    } else if (newHand.numberCards.length === 7) {
      newHand.status = "stood";
    }
  } else if (card.type === "modifier") {
    newHand.modifiers = [...newHand.modifiers, card.value];
    newLog.push({ playerId, card, event: "deal" });
  } else if (card.type === "action") {
    newHand.actions = [...newHand.actions, card.value];
    newLog.push({ playerId, card, event: "deal" });

    if (card.value === "Freeze") {
      newHand.status = "frozen";
    } else if (card.value === "Second Chance") {
      if (newHand.hasSecondChance) {
        pendingType = "second_chance_gift";
      } else {
        newHand.hasSecondChance = true;
      }
    } else if (card.value === "Flip Three") {
      pendingType = "flip_three_target";
    }
  }

  return { deck: rest, hand: newHand, dealLog: newLog, reshuffled, card, pendingType };
}

// Deals exactly one card to a target during Flip Three resolution.
// Returns the updated state plus any queued actions from that single card.
function dealOneFlipThreeCard(deck, playerHands, targetPlayerId, dealLog) {
  let currentHands = { ...playerHands };
  let currentHand = { ...currentHands[targetPlayerId] };
  const flipThreeQueue = [];

  if (currentHand.status !== "playing") {
    return { deck, playerHands: currentHands, dealLog, reshuffled: false, flipThreeQueue, stopped: true };
  }

  const result = dealOneCard(deck, currentHand, targetPlayerId, dealLog);
  currentHand = result.hand;

  let stopped = false;
  if (result.card.type === "action" && result.card.value === "Freeze") stopped = true;

  if (result.pendingType === "flip_three_target") {
    flipThreeQueue.push({ type: "flip_three_target", chooserId: targetPlayerId });
  }
  if (result.pendingType === "second_chance_gift") {
    flipThreeQueue.push({ type: "second_chance_gift", chooserId: targetPlayerId });
  }

  // Check if player is no longer playing after this card
  if (currentHand.status !== "playing") stopped = true;

  currentHands = { ...currentHands, [targetPlayerId]: currentHand };
  return { deck: result.deck, playerHands: currentHands, dealLog: result.dealLog, reshuffled: result.reshuffled, flipThreeQueue, stopped };
}

// Process the next item in a flip three queue, returning the new pendingAction (or null).
function processQueue(queue, turnOrder, playerHands, sourcePlayerId) {
  if (queue.length === 0) return null;

  const [next, ...remaining] = queue;

  if (next.type === "flip_three_target") {
    return {
      type: "flip_three_target",
      sourcePlayerId: next.chooserId,
      chooserId: next.chooserId,
      flipThreeQueue: remaining,
    };
  }

  if (next.type === "second_chance_gift") {
    const eligible = turnOrder.filter(pid =>
      pid !== next.chooserId &&
      playerHands[pid].status === "playing" &&
      !playerHands[pid].hasSecondChance
    );
    if (eligible.length === 0) {
      // No eligible recipients — discard and process next in queue
      return processQueue(remaining, turnOrder, playerHands, sourcePlayerId);
    }
    return {
      type: "second_chance_gift",
      sourcePlayerId: next.chooserId,
      eligiblePlayerIds: eligible,
      flipThreeQueue: remaining,
    };
  }

  return null;
}

export function gameReducer(state, action) {
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
        dialog: null,
      };

    case ACTIONS.NAVIGATE: {
      const screen = action.payload;
      switch (screen) {
        case "home":
          return { ...state, screen: "home", selectedPlayer: null, editingRound: null };
        case "setup":
          return { ...state, screen: "setup" };
        case "game":
          return { ...state, screen: "game", selectedPlayer: null, editingRound: null };
        case "round":
          return { ...state, screen: "round", editingRound: action.editingRound ?? null, selectedPlayer: action.playerId ?? state.selectedPlayer };
        case "detail":
          return { ...state, screen: "detail", selectedPlayer: action.playerId };
        default:
          return state;
      }
    }

    case ACTIONS.SET_DIALOG:
      return { ...state, dialog: action.payload };

    case ACTIONS.TOGGLE_DECK:
      return { ...state, deckOpen: !state.deckOpen };

    case ACTIONS.TOGGLE_CHEATER:
      return { ...state, cheaterMode: !state.cheaterMode };

    case ACTIONS.START_NEW_GAME: {
      const mode = action.payload?.mode || "tracker";
      const g = newGame(mode);
      return { ...state, game: g, screen: "setup", dialog: null };
    }

    // ─── Play Mode Actions ──────────────────────────────────

    case ACTIONS.START_PLAY_ROUND: {
      const { game } = state;
      const players = game.tiebreaker
        ? game.players.filter(p => game.tiebreaker.playerIds.includes(p.id))
        : game.players;

      // Build turn order starting from dealer+1
      const dealerIdx = game.dealerIndex || 0;
      const allPlayers = game.players;
      const turnOrder = [];
      for (let i = 1; i <= allPlayers.length; i++) {
        const p = allPlayers[(dealerIdx + i) % allPlayers.length];
        if (players.some(tp => tp.id === p.id)) {
          turnOrder.push(p.id);
        }
      }

      // Init empty hands
      const playerHands = {};
      turnOrder.forEach(pid => {
        playerHands[pid] = {
          numberCards: [],
          modifiers: [],
          actions: [],
          cancelledCards: [],
          status: "playing",
          hasSecondChance: false,
        };
      });

      // Ensure deck is ready (no initial deal — players must hit to draw)
      let deck = game.deck && game.deck.length > 0 ? [...game.deck] : createShuffledDeck();
      let dealLog = [];
      let reshuffled = false;

      let turnIndex = 0;

      return {
        ...state,
        screen: "round",
        game: {
          ...game,
          deck,
          lastReshuffle: reshuffled ? game.rounds.length : game.lastReshuffle,
          playRound: { turnIndex, turnOrder, playerHands, dealLog, pendingAction: null },
        },
      };
    }

    case ACTIONS.PLAYER_HIT: {
      const { game } = state;
      const pr = game.playRound;
      const playerId = pr.turnOrder[pr.turnIndex];
      const hand = { ...pr.playerHands[playerId] };

      const result = dealOneCard([...game.deck], hand, playerId, [...pr.dealLog]);
      const newHands = { ...pr.playerHands, [playerId]: result.hand };

      // Check if a pending action is needed
      if (result.pendingType === "flip_three_target") {
        // Check if only one playing player — auto-select self
        const playingPlayers = pr.turnOrder.filter(pid => newHands[pid].status === "playing");
        if (playingPlayers.length <= 1) {
          // Auto-resolve: deal first card to self, then stagger the rest
          const firstCard = dealOneFlipThreeCard(result.deck, newHands, playerId, result.dealLog);
          const combinedQueue = [...firstCard.flipThreeQueue];

          if (firstCard.stopped) {
            // Target stopped on first card — done
            const nextPending = processQueue(combinedQueue, pr.turnOrder, firstCard.playerHands, playerId);
            let turnIndex = pr.turnIndex;
            if (!nextPending) {
              turnIndex = findNextPlayingIndex(pr.turnOrder, firstCard.playerHands, pr.turnIndex);
              if (turnIndex === -1) turnIndex = pr.turnIndex;
            }
            return {
              ...state,
              game: {
                ...game,
                deck: firstCard.deck,
                lastReshuffle: result.reshuffled || firstCard.reshuffled ? game.rounds.length : game.lastReshuffle,
                playRound: { ...pr, playerHands: firstCard.playerHands, dealLog: firstCard.dealLog, turnIndex, pendingAction: nextPending },
              },
            };
          }

          return {
            ...state,
            game: {
              ...game,
              deck: firstCard.deck,
              lastReshuffle: result.reshuffled || firstCard.reshuffled ? game.rounds.length : game.lastReshuffle,
              playRound: {
                ...pr,
                playerHands: firstCard.playerHands,
                dealLog: firstCard.dealLog,
                pendingAction: {
                  type: "flip_three_dealing",
                  targetPlayerId: playerId,
                  remaining: 2,
                  sourcePlayerId: playerId,
                  flipThreeQueue: combinedQueue,
                },
              },
            },
          };
        }

        // Show target selection UI
        return {
          ...state,
          game: {
            ...game,
            deck: result.deck,
            lastReshuffle: result.reshuffled ? game.rounds.length : game.lastReshuffle,
            playRound: {
              ...pr,
              playerHands: newHands,
              dealLog: result.dealLog,
              pendingAction: {
                type: "flip_three_target",
                sourcePlayerId: playerId,
                chooserId: playerId,
                flipThreeQueue: [],
              },
            },
          },
        };
      }

      if (result.pendingType === "second_chance_gift") {
        const eligible = pr.turnOrder.filter(pid =>
          pid !== playerId &&
          newHands[pid].status === "playing" &&
          !newHands[pid].hasSecondChance
        );

        if (eligible.length === 0) {
          // No eligible recipients — discard and advance turn (round-robin)
          const newLog = [...result.dealLog, { playerId, card: { type: "action", value: "Second Chance" }, event: "second_chance_discarded" }];
          const nextTurn = findNextPlayingIndex(pr.turnOrder, newHands, pr.turnIndex);
          return {
            ...state,
            game: {
              ...game,
              deck: result.deck,
              lastReshuffle: result.reshuffled ? game.rounds.length : game.lastReshuffle,
              playRound: {
                ...pr,
                playerHands: newHands,
                dealLog: newLog,
                turnIndex: nextTurn === -1 ? pr.turnIndex : nextTurn,
                pendingAction: null,
              },
            },
          };
        }

        // Show Second Chance gift selection UI
        return {
          ...state,
          game: {
            ...game,
            deck: result.deck,
            lastReshuffle: result.reshuffled ? game.rounds.length : game.lastReshuffle,
            playRound: {
              ...pr,
              playerHands: newHands,
              dealLog: result.dealLog,
              pendingAction: {
                type: "second_chance_gift",
                sourcePlayerId: playerId,
                eligiblePlayerIds: eligible,
                flipThreeQueue: [],
              },
            },
          },
        };
      }

      // Normal card — round-robin: always advance turn
      const nextTurn = findNextPlayingIndex(pr.turnOrder, newHands, pr.turnIndex);

      return {
        ...state,
        game: {
          ...game,
          deck: result.deck,
          lastReshuffle: result.reshuffled ? game.rounds.length : game.lastReshuffle,
          playRound: {
            ...pr,
            playerHands: newHands,
            dealLog: result.dealLog,
            turnIndex: nextTurn === -1 ? pr.turnIndex : nextTurn,
            pendingAction: null,
          },
        },
      };
    }

    case ACTIONS.PLAYER_STAND: {
      const { game } = state;
      const pr = game.playRound;
      const playerId = pr.turnOrder[pr.turnIndex];

      const newHands = {
        ...pr.playerHands,
        [playerId]: { ...pr.playerHands[playerId], status: "stood" },
      };

      let turnIndex = findNextPlayingIndex(pr.turnOrder, newHands, pr.turnIndex);

      return {
        ...state,
        game: {
          ...game,
          playRound: {
            ...pr,
            playerHands: newHands,
            turnIndex: turnIndex === -1 ? pr.turnIndex : turnIndex,
          },
        },
      };
    }

    case ACTIONS.RESOLVE_FLIP_THREE: {
      const { game } = state;
      const pr = game.playRound;
      const { targetPlayerId } = action.payload;
      const pending = pr.pendingAction;

      // Deal the first card immediately
      const result = dealOneFlipThreeCard(
        [...game.deck], { ...pr.playerHands }, targetPlayerId, [...pr.dealLog]
      );

      const combinedQueue = [...result.flipThreeQueue, ...pending.flipThreeQueue];
      const remaining = 2; // 3 total, 1 just dealt

      // If target busted/froze on the first card, finish dealing
      if (result.stopped) {
        const nextPending = processQueue(combinedQueue, pr.turnOrder, result.playerHands, pending.sourcePlayerId);
        let turnIndex = pr.turnIndex;
        if (!nextPending) {
          turnIndex = findNextPlayingIndex(pr.turnOrder, result.playerHands, pr.turnIndex);
          if (turnIndex === -1) turnIndex = pr.turnIndex;
        }
        return {
          ...state,
          game: {
            ...game,
            deck: result.deck,
            lastReshuffle: result.reshuffled ? game.rounds.length : game.lastReshuffle,
            playRound: { ...pr, playerHands: result.playerHands, dealLog: result.dealLog, turnIndex, pendingAction: nextPending },
          },
        };
      }

      // Set up staggered dealing state — remaining cards will be dealt by timer
      return {
        ...state,
        game: {
          ...game,
          deck: result.deck,
          lastReshuffle: result.reshuffled ? game.rounds.length : game.lastReshuffle,
          playRound: {
            ...pr,
            playerHands: result.playerHands,
            dealLog: result.dealLog,
            pendingAction: {
              type: "flip_three_dealing",
              targetPlayerId,
              remaining,
              sourcePlayerId: pending.sourcePlayerId,
              flipThreeQueue: combinedQueue,
            },
          },
        },
      };
    }

    case ACTIONS.FLIP_THREE_DEAL_NEXT: {
      const { game } = state;
      const pr = game.playRound;
      const pending = pr.pendingAction;

      if (!pending || pending.type !== "flip_three_dealing") return state;

      const { targetPlayerId, remaining, sourcePlayerId, flipThreeQueue } = pending;

      const result = dealOneFlipThreeCard(
        [...game.deck], { ...pr.playerHands }, targetPlayerId, [...pr.dealLog]
      );

      const combinedQueue = [...result.flipThreeQueue, ...flipThreeQueue];
      const newRemaining = remaining - 1;

      // If target stopped (busted/froze) or no more cards to deal, finish
      if (result.stopped || newRemaining <= 0) {
        const nextPending = processQueue(combinedQueue, pr.turnOrder, result.playerHands, sourcePlayerId);
        let turnIndex = pr.turnIndex;
        if (!nextPending) {
          turnIndex = findNextPlayingIndex(pr.turnOrder, result.playerHands, pr.turnIndex);
          if (turnIndex === -1) turnIndex = pr.turnIndex;
        }
        return {
          ...state,
          game: {
            ...game,
            deck: result.deck,
            lastReshuffle: result.reshuffled ? game.rounds.length : game.lastReshuffle,
            playRound: { ...pr, playerHands: result.playerHands, dealLog: result.dealLog, turnIndex, pendingAction: nextPending },
          },
        };
      }

      // More cards to deal — keep the dealing state
      return {
        ...state,
        game: {
          ...game,
          deck: result.deck,
          lastReshuffle: result.reshuffled ? game.rounds.length : game.lastReshuffle,
          playRound: {
            ...pr,
            playerHands: result.playerHands,
            dealLog: result.dealLog,
            pendingAction: {
              type: "flip_three_dealing",
              targetPlayerId,
              remaining: newRemaining,
              sourcePlayerId,
              flipThreeQueue: combinedQueue,
            },
          },
        },
      };
    }

    case ACTIONS.RESOLVE_SECOND_CHANCE: {
      const { game } = state;
      const pr = game.playRound;
      const { targetPlayerId } = action.payload;
      const pending = pr.pendingAction;

      // Move the Second Chance from source's actions to target's actions
      const sourceHand = { ...pr.playerHands[pending.sourcePlayerId] };
      const scIdx = sourceHand.actions.indexOf("Second Chance");
      if (scIdx !== -1) {
        sourceHand.actions = [...sourceHand.actions];
        sourceHand.actions.splice(scIdx, 1);
      }
      const targetHand = { ...pr.playerHands[targetPlayerId] };
      targetHand.actions = [...targetHand.actions, "Second Chance"];
      targetHand.hasSecondChance = true;

      const newHands = {
        ...pr.playerHands,
        [pending.sourcePlayerId]: sourceHand,
        [targetPlayerId]: targetHand,
      };
      const newLog = [...pr.dealLog, {
        playerId: targetPlayerId,
        card: { type: "action", value: "Second Chance" },
        event: "second_chance_gift",
      }];

      // Process next in queue or advance turn
      const nextPending = processQueue(pending.flipThreeQueue, pr.turnOrder, newHands, pending.sourcePlayerId);

      let turnIndex = pr.turnIndex;
      if (!nextPending) {
        turnIndex = findNextPlayingIndex(pr.turnOrder, newHands, pr.turnIndex);
        if (turnIndex === -1) turnIndex = pr.turnIndex;
      }

      return {
        ...state,
        game: {
          ...game,
          playRound: {
            ...pr,
            playerHands: newHands,
            dealLog: newLog,
            turnIndex,
            pendingAction: nextPending,
          },
        },
      };
    }

    case ACTIONS.END_PLAY_ROUND: {
      const { game } = state;
      const pr = game.playRound;

      const playerResults = {};
      for (const [pid, hand] of Object.entries(pr.playerHands)) {
        const busted = hand.status === "busted";
        const result = calculateScore(hand.numberCards, hand.modifiers, busted);
        // Merge cancelled cards back so getEffectiveDealtCards counts them
        const cancelledNumbers = (hand.cancelledCards || []).filter(c => c.type === "number").map(c => c.value);
        const cancelledModifiers = (hand.cancelledCards || []).filter(c => c.type === "modifier").map(c => c.value);
        const cancelledActions = (hand.cancelledCards || []).filter(c => c.type === "action").map(c => c.value);
        playerResults[pid] = {
          numberCards: [...hand.numberCards, ...cancelledNumbers],
          modifiers: [...hand.modifiers, ...cancelledModifiers],
          actions: [...hand.actions, ...cancelledActions],
          busted,
          score: result.total,
          flip7: result.flip7,
        };
      }

      // Players not in this round (tiebreaker excluded them) get 0
      for (const p of game.players) {
        if (!playerResults[p.id]) {
          playerResults[p.id] = {
            numberCards: [],
            modifiers: [],
            actions: [],
            busted: false,
            score: 0,
            flip7: false,
          };
        }
      }

      const roundData = {
        roundNumber: game.rounds.length + 1,
        playerResults,
        dealOrder: pr.dealLog,
      };

      const rounds = [...game.rounds, roundData];
      const nextDealer = (game.dealerIndex + 1) % game.players.length;

      return {
        ...state,
        screen: "game",
        game: {
          ...game,
          rounds,
          dealerIndex: nextDealer,
          playRound: null,
        },
      };
    }

    case ACTIONS.SET_TIEBREAKER:
      return {
        ...state,
        game: {
          ...state.game,
          tiebreaker: {
            playerIds: action.payload.playerIds,
            startedAtRound: state.game.rounds.length,
          },
        },
      };

    case ACTIONS.CLEAR_TIEBREAKER:
      return {
        ...state,
        game: { ...state.game, tiebreaker: null },
      };

    default:
      return state;
  }
}
