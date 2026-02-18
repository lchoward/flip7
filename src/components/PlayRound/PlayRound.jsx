import { useEffect, useRef } from "react";
import { useGame } from "../../context/GameContext";
import { ACTIONS } from "../../context/gameReducer";
import { calculateScore } from "../../utils/scoring";
import { calculateBustChance } from "../../utils/bustCalculator";
import { decideAction, chooseFlipThreeTarget, chooseSecondChanceTarget } from "../../utils/computerStrategy";
import CardVisual from "../CardVisual/CardVisual";
import DeckTracker from "../DeckTracker/DeckTracker";
import styles from "./PlayRound.module.css";

export default function PlayRound() {
  const { game, cheaterMode, deckOpen, getEffectiveDealtCards, dispatch } = useGame();
  const pr = game.playRound;
  const dealTimerRef = useRef(null);

  // Auto-deal next Flip Three card after 1 second
  useEffect(() => {
    if (pr?.pendingAction?.type === "flip_three_dealing") {
      dealTimerRef.current = setTimeout(() => {
        dispatch({ type: ACTIONS.FLIP_THREE_DEAL_NEXT });
      }, 1000);
      return () => clearTimeout(dealTimerRef.current);
    }
  }, [pr?.pendingAction?.type, pr?.pendingAction?.remaining, dispatch]);

  // Keyboard shortcuts: H = Hit, S = Stand, Enter = End Round
  useEffect(() => {
    const handleKey = (e) => {
      if (!pr) return;
      const pending = pr.pendingAction !== null;
      const over = !pending && pr.turnOrder.every(pid => pr.playerHands[pid].status !== "playing");

      if (over && e.key === "Enter") {
        dispatch({ type: ACTIONS.END_PLAY_ROUND });
        return;
      }

      if (pending || over) return;

      // Disable hit/stand shortcuts during CPU turns
      const activePid = pr.turnOrder[pr.turnIndex];
      if (game.players.find(p => p.id === activePid)?.isComputer) return;

      const key = e.key.toLowerCase();
      if (key === "h") {
        dispatch({ type: ACTIONS.PLAYER_HIT });
      } else if (key === "s") {
        dispatch({ type: ACTIONS.PLAYER_STAND });
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [pr, game.players, dispatch]);

  // Auto-play for computer players
  useEffect(() => {
    if (!pr) return;
    const pending = pr.pendingAction;
    const over = !pending && pr.turnOrder.every(pid => pr.playerHands[pid].status !== "playing");

    // Handle pending actions from computer choosers
    if (pending?.type === "flip_three_target") {
      const chooser = game.players.find(p => p.id === pending.chooserId);
      if (chooser?.isComputer) {
        const playingIds = pr.turnOrder.filter(pid => pr.playerHands[pid].status === "playing");
        const timer = setTimeout(() => {
          const target = chooseFlipThreeTarget(pending.chooserId, playingIds, game);
          dispatch({ type: ACTIONS.RESOLVE_FLIP_THREE, payload: { targetPlayerId: target } });
        }, 800);
        return () => clearTimeout(timer);
      }
      return;
    }

    if (pending?.type === "second_chance_gift") {
      const chooser = game.players.find(p => p.id === pending.sourcePlayerId);
      if (chooser?.isComputer) {
        const timer = setTimeout(() => {
          const target = chooseSecondChanceTarget(pending.eligiblePlayerIds, game);
          dispatch({ type: ACTIONS.RESOLVE_SECOND_CHANCE, payload: { targetPlayerId: target } });
        }, 800);
        return () => clearTimeout(timer);
      }
      return;
    }

    // Skip if dealing animation or other pending action
    if (pending || over) return;

    const activePid = pr.turnOrder[pr.turnIndex];
    const player = game.players.find(p => p.id === activePid);
    if (!player?.isComputer) return;

    const hand = pr.playerHands[activePid];
    const timer = setTimeout(() => {
      const action = decideAction({
        playerId: activePid,
        hand,
        dealt: getEffectiveDealtCards(),
        allPlayerData: (() => {
          const data = {};
          for (const [pid, h] of Object.entries(pr.playerHands)) {
            const cancelledNumbers = (h.cancelledCards || []).filter(c => c.type === "number").map(c => c.value);
            const cancelledModifiers = (h.cancelledCards || []).filter(c => c.type === "modifier").map(c => c.value);
            const cancelledActions = (h.cancelledCards || []).filter(c => c.type === "action").map(c => c.value);
            data[pid] = {
              numberCards: [...h.numberCards, ...cancelledNumbers],
              modifiers: [...h.modifiers, ...cancelledModifiers],
              actions: [...h.actions, ...cancelledActions],
            };
          }
          return data;
        })(),
        game,
      });
      if (action === "hit") {
        dispatch({ type: ACTIONS.PLAYER_HIT });
      } else {
        dispatch({ type: ACTIONS.PLAYER_STAND });
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [pr, game, getEffectiveDealtCards, dispatch]);

  if (!pr) return null;

  const activePlayerId = pr.turnOrder[pr.turnIndex];
  const pendingAction = pr.pendingAction;
  const isPending = pendingAction !== null;
  const roundOver = !isPending && pr.turnOrder.every(pid => pr.playerHands[pid].status !== "playing");

  const getPlayerName = (pid) => game.players.find(p => p.id === pid)?.name || "?";
  const isComputerPlayer = (pid) => game.players.find(p => p.id === pid)?.isComputer === true;

  // Build allPlayerData for bust calc (matches deckUtils shape)
  // Include cancelled cards so remaining-card counts stay accurate
  const allPlayerData = {};
  for (const [pid, hand] of Object.entries(pr.playerHands)) {
    const cancelledNumbers = (hand.cancelledCards || []).filter(c => c.type === "number").map(c => c.value);
    const cancelledModifiers = (hand.cancelledCards || []).filter(c => c.type === "modifier").map(c => c.value);
    const cancelledActions = (hand.cancelledCards || []).filter(c => c.type === "action").map(c => c.value);
    allPlayerData[pid] = {
      numberCards: [...hand.numberCards, ...cancelledNumbers],
      modifiers: [...hand.modifiers, ...cancelledModifiers],
      actions: [...hand.actions, ...cancelledActions],
    };
  }

  const dealt = getEffectiveDealtCards();


  return (
    <div className={`app ${styles.playRound} fade-in`}>
      <div className={styles.header}>
        <h2>Round {game.rounds.length + 1}</h2>
        <button
          className={`${styles.cheaterToggle} ${cheaterMode ? styles.cheaterActive : ""}`}
          onClick={() => dispatch({ type: ACTIONS.TOGGLE_CHEATER })}
        >
          {cheaterMode ? "Cheater: ON" : "Cheater: OFF"}
        </button>
      </div>

      <div className={styles.deckCount}>
        {game.deck.length} cards in deck
      </div>

      {game.tiebreaker && (
        <div className={styles.tiebreakerBanner}>
          Tiebreaker Round — {game.tiebreaker.playerIds.map(pid => getPlayerName(pid)).join(" vs ")}
        </div>
      )}

      {/* Flip Three target selection */}
      {pendingAction?.type === "flip_three_target" && (
        <div className={styles.pendingActionBar}>
          {isComputerPlayer(pendingAction.chooserId) ? (
            <div className={styles.pendingLabel}>
              Flip Three! {getPlayerName(pendingAction.chooserId)} is choosing a target
              <span className={styles.cpuThinking}>
                <span className={styles.thinkingDot} />
                <span className={styles.thinkingDot} />
                <span className={styles.thinkingDot} />
              </span>
            </div>
          ) : (
            <>
              <div className={styles.pendingLabel}>
                Flip Three! {getPlayerName(pendingAction.chooserId)} picks a target:
              </div>
              <div className={styles.targetButtons}>
                {pr.turnOrder
                  .filter(pid => pr.playerHands[pid].status === "playing")
                  .map(pid => (
                    <button
                      key={pid}
                      className={`btn btn-small ${styles.targetBtn}`}
                      onClick={() => dispatch({
                        type: ACTIONS.RESOLVE_FLIP_THREE,
                        payload: { targetPlayerId: pid },
                      })}
                    >
                      {getPlayerName(pid)}
                    </button>
                  ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Flip Three dealing animation */}
      {pendingAction?.type === "flip_three_dealing" && (
        <div className={`${styles.pendingActionBar} ${styles.dealing}`}>
          <div className={styles.pendingLabel}>
            Dealing to {getPlayerName(pendingAction.targetPlayerId)}...
          </div>
          <div className={styles.dealingDots}>
            {Array.from({ length: 3 - pendingAction.remaining }, (_, i) => (
              <span key={i} className={styles.dealingDot} />
            ))}
            {Array.from({ length: pendingAction.remaining }, (_, i) => (
              <span key={`empty-${i}`} className={`${styles.dealingDot} ${styles.dealingDotEmpty}`} />
            ))}
          </div>
        </div>
      )}

      {/* Second Chance gift selection */}
      {pendingAction?.type === "second_chance_gift" && (
        <div className={`${styles.pendingActionBar} ${styles.secondChance}`}>
          {isComputerPlayer(pendingAction.sourcePlayerId) ? (
            <div className={styles.pendingLabel}>
              Extra Second Chance! {getPlayerName(pendingAction.sourcePlayerId)} is choosing
              <span className={styles.cpuThinking}>
                <span className={styles.thinkingDot} />
                <span className={styles.thinkingDot} />
                <span className={styles.thinkingDot} />
              </span>
            </div>
          ) : (
            <>
              <div className={styles.pendingLabel}>
                Extra Second Chance! {getPlayerName(pendingAction.sourcePlayerId)} gives it to:
              </div>
              <div className={styles.targetButtons}>
                {pendingAction.eligiblePlayerIds.map(pid => (
                  <button
                    key={pid}
                    className={`btn btn-small ${styles.targetBtn} ${styles.targetBtnSC}`}
                    onClick={() => dispatch({
                      type: ACTIONS.RESOLVE_SECOND_CHANCE,
                      payload: { targetPlayerId: pid },
                    })}
                  >
                    {getPlayerName(pid)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {pr.turnOrder.map(pid => {
        const hand = pr.playerHands[pid];
        const isActive = pid === activePlayerId && !roundOver && !isPending;
        const busted = hand.status === "busted";
        const stood = hand.status === "stood" || hand.status === "frozen";
        const result = calculateScore(hand.numberCards, hand.modifiers, busted);

        // Find duplicate numbers for highlighting
        const numCounts = {};
        hand.numberCards.forEach(n => { numCounts[n] = (numCounts[n] || 0) + 1; });

        return (
          <div
            key={pid}
            className={`${styles.playerSection} ${isActive ? styles.active : ""} ${busted ? styles.busted : ""} ${stood ? styles.stood : ""}`}
          >
            <div className={styles.playerHeader}>
              <div className={styles.playerName}>
                {getPlayerName(pid)}
                {isComputerPlayer(pid) && <span className={styles.cpuBadge}>CPU</span>}
                {hand.status === "frozen" && <span className={styles.statusBadge}>FROZEN</span>}
                {hand.status === "stood" && <span className={styles.statusBadge}>STOOD</span>}
                {hand.status === "busted" && <span className={`${styles.statusBadge} ${styles.bustBadge}`}>BUST</span>}
                {isActive && <span className={`${styles.statusBadge} ${styles.activeBadge}`}>ACTIVE</span>}
              </div>
              <div className={`${styles.playerScore} ${busted ? styles.bustScore : ""}`}>
                {busted ? 0 : result.total}
              </div>
            </div>

            <div className={styles.cardRow}>
              {hand.numberCards.map((n, i) => (
                <CardVisual
                  key={`n-${i}`}
                  type="number"
                  value={n}
                  dimmed={busted}
                  highlight={numCounts[n] > 1}
                />
              ))}
              {hand.modifiers.map((m, i) => (
                <CardVisual key={`m-${i}`} type="modifier" value={m} dimmed={busted} />
              ))}
              {hand.actions.map((a, i) => (
                <CardVisual key={`a-${i}`} type="action" value={a} dimmed={busted} />
              ))}
              {(hand.cancelledCards || []).map((c, i) => (
                <CardVisual key={`x-${i}`} type={c.type} value={c.value} cancelled />
              ))}
              {hand.numberCards.length === 0 && hand.modifiers.length === 0 && hand.actions.length === 0 && !(hand.cancelledCards || []).length && (
                <div className={styles.noCards}>No cards</div>
              )}
            </div>

            {!busted && (hand.numberCards.length > 0 || hand.modifiers.length > 0) && (
              <div className={styles.scoreBreakdown}>{result.breakdown}</div>
            )}

            {hand.hasSecondChance && hand.status === "playing" && (
              <div className={styles.shieldBadge}>Second Chance active</div>
            )}

            {result.flip7 && !busted && (
              <div className={styles.flip7Badge}>FLIP 7!</div>
            )}

            {cheaterMode && hand.status === "playing" && hand.numberCards.length > 0 && dealt && (() => {
              const { bustChance, bustCards, totalRemaining } = calculateBustChance(
                hand.numberCards, dealt, allPlayerData
              );
              return (
                <div className={`${styles.bustChanceBanner} ${
                  bustChance >= 75 ? styles.bustDanger :
                  bustChance >= 50 ? styles.bustWarning :
                  bustChance >= 25 ? styles.bustCaution :
                  styles.bustSafe
                }`}>
                  <span className={styles.bustChanceValue}>{bustChance.toFixed(1)}%</span>
                  <span className={styles.bustChanceLabel}>
                    bust ({bustCards}/{totalRemaining})
                  </span>
                </div>
              );
            })()}

            {isActive && isComputerPlayer(pid) && (
              <div className={styles.cpuThinking}>
                Thinking
                <span className={styles.thinkingDot} />
                <span className={styles.thinkingDot} />
                <span className={styles.thinkingDot} />
              </div>
            )}

            {isActive && !isComputerPlayer(pid) && (
              <div className={styles.actionButtons}>
                <button
                  className="btn btn-primary btn-small"
                  onClick={() => dispatch({ type: ACTIONS.PLAYER_HIT })}
                >
                  Hit
                </button>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => dispatch({ type: ACTIONS.PLAYER_STAND })}
                >
                  Stand
                </button>
              </div>
            )}
          </div>
        );
      })}

      {roundOver && (
        <div className={styles.roundOverBar}>
          <div className={styles.roundOverLabel}>Round Complete</div>
          <button
            className="btn btn-primary"
            onClick={() => dispatch({ type: ACTIONS.END_PLAY_ROUND })}
          >
            End Round
          </button>
        </div>
      )}

      {cheaterMode && dealt && (
        <DeckTracker
          dealt={dealt}
          deckOpen={deckOpen}
          onToggle={() => dispatch({ type: ACTIONS.TOGGLE_DECK })}
          lastReshuffle={game.lastReshuffle}
          onReset={null}
        />
      )}
    </div>
  );
}
