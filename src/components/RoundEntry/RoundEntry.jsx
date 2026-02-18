import { useState, useRef, useEffect } from "react";
import { useGame } from "../../context/GameContext";
import { ACTIONS } from "../../context/gameReducer";
import { DECK } from "../../constants/deck";
import { calculateScore, hasDuplicateNumbers } from "../../utils/scoring";
import { calculateBustChance } from "../../utils/bustCalculator";
import { getRemainingCards, getTotalRemaining, getCardRemaining } from "../../utils/deckUtils";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import styles from "./RoundEntry.module.css";

export default function RoundEntry() {
  const { game, editingRound, selectedPlayer, cheaterMode, getEffectiveDealtCards, dispatch } = useGame();
  const isEdit = editingRound !== null;
  const existingRound = isEdit ? game.rounds[editingRound] : null;

  const [playerData, setPlayerData] = useState(() => {
    const data = {};
    game.players.forEach(p => {
      const existing = existingRound?.playerResults[p.id];
      data[p.id] = existing
        ? { numberCards: [...(existing.numberCards || [])], modifiers: [...(existing.modifiers || [])], actions: [...(existing.actions || [])] }
        : { numberCards: [], modifiers: [], actions: [] };
    });
    return data;
  });

  const [dealSequence, setDealSequence] = useState(() => {
    if (existingRound?.dealOrder) return [...existingRound.dealOrder];
    return [];
  });
  const nextSeq = useRef(
    existingRound?.dealOrder?.length > 0
      ? Math.max(...existingRound.dealOrder.map(d => d.seq)) + 1
      : 1
  );

  const [expandedPlayer, setExpandedPlayer] = useState(selectedPlayer ?? game.players[0]?.id);
  const [cardWarning, setCardWarning] = useState(null);
  const [showShufflePrompt, setShowShufflePrompt] = useState(false);
  const shufflePromptShown = useRef(false);

  const updatePlayer = (pid, updates) => {
    setPlayerData(prev => ({ ...prev, [pid]: { ...prev[pid], ...updates } }));
  };

  const getAdjustedDealt = () => {
    const dealt = getEffectiveDealtCards();
    if (isEdit && existingRound) {
      Object.values(existingRound.playerResults).forEach(r => {
        (r.numberCards || []).forEach(c => { dealt.numbers[c] = Math.max(0, (dealt.numbers[c] || 0) - 1); });
        (r.modifiers || []).forEach(m => { dealt.modifiers[m] = Math.max(0, (dealt.modifiers[m] || 0) - 1); });
        (r.actions || []).forEach(a => { dealt.actions[a] = Math.max(0, (dealt.actions[a] || 0) - 1); });
      });
    }
    return dealt;
  };

  const attemptAddCard = (pid, cardType, cardValue) => {
    const pd = playerData[pid];

    if (cardType === "number") {
      if (pd.numberCards.length >= 7) return;
      const count = pd.numberCards.filter(c => c === cardValue).length;
      if (count >= 2) return;
    }

    const dealt = getAdjustedDealt();
    const remaining = getRemainingCards(dealt, playerData);
    const cardRemaining = getCardRemaining(remaining, cardType, cardValue);

    if (cardRemaining <= 0) {
      setCardWarning({ cardType, cardValue, playerId: pid });
      return;
    }

    commitCard(pid, cardType, cardValue);
  };

  const commitCard = (pid, cardType, cardValue) => {
    const pd = playerData[pid];
    if (cardType === "number") {
      updatePlayer(pid, { numberCards: [...pd.numberCards, cardValue] });
    } else if (cardType === "modifier") {
      updatePlayer(pid, { modifiers: [...pd.modifiers, cardValue] });
    } else {
      updatePlayer(pid, { actions: [...pd.actions, cardValue] });
    }
    setDealSequence(prev => [...prev, {
      seq: nextSeq.current++,
      playerId: pid,
      cardType,
      cardValue,
    }]);
  };

  const removeCard = (pid, cardType, index) => {
    const pd = playerData[pid];
    let cardValue;
    if (cardType === "number") {
      cardValue = pd.numberCards[index];
      const cards = [...pd.numberCards];
      cards.splice(index, 1);
      updatePlayer(pid, { numberCards: cards });
    } else if (cardType === "modifier") {
      cardValue = pd.modifiers[index];
      const mods = [...pd.modifiers];
      mods.splice(index, 1);
      updatePlayer(pid, { modifiers: mods });
    } else {
      cardValue = pd.actions[index];
      const acts = [...pd.actions];
      acts.splice(index, 1);
      updatePlayer(pid, { actions: acts });
    }

    setDealSequence(prev => {
      const reversed = [...prev].reverse();
      const idx = reversed.findIndex(
        d => d.playerId === pid && d.cardType === cardType && d.cardValue === cardValue
      );
      if (idx === -1) return prev;
      const realIdx = prev.length - 1 - idx;
      return [...prev.slice(0, realIdx), ...prev.slice(realIdx + 1)];
    });
  };

  // Auto-shuffle detection
  useEffect(() => {
    if (isEdit) return;
    const dealt = getAdjustedDealt();
    const remaining = getRemainingCards(dealt, playerData);
    const total = getTotalRemaining(remaining);

    if (total <= 0 && !shufflePromptShown.current) {
      shufflePromptShown.current = true;
      setShowShufflePrompt(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerData]);

  const handleSave = () => {
    const roundNumber = isEdit ? editingRound + 1 : game.rounds.length + 1;
    const playerResults = {};
    game.players.forEach(p => {
      const pd = playerData[p.id];
      const busted = hasDuplicateNumbers(pd.numberCards);
      const result = calculateScore(pd.numberCards, pd.modifiers, busted);
      playerResults[p.id] = {
        numberCards: pd.numberCards,
        modifiers: pd.modifiers,
        actions: pd.actions,
        busted,
        score: result.total,
        flip7: result.flip7,
      };
    });
    dispatch({ type: ACTIONS.SAVE_ROUND, payload: { roundData: { roundNumber, playerResults, dealOrder: dealSequence }, editingRound } });
  };

  const handleCancel = () => {
    if (isEdit && selectedPlayer) {
      dispatch({ type: ACTIONS.NAVIGATE, payload: "detail", playerId: selectedPlayer });
    } else {
      dispatch({ type: ACTIONS.NAVIGATE, payload: "game" });
    }
  };

  const getPlayerInitial = (pid) => {
    const player = game.players.find(p => p.id === pid);
    return player ? player.name.charAt(0).toUpperCase() : "?";
  };

  return (
    <div className={`app ${styles.roundEntry} fade-in`}>
      <div className={styles.roundHeader}>
        <h2>{isEdit ? `Edit Round ${editingRound + 1}` : `Round ${game.rounds.length + 1}`}</h2>
        <button
          className={`${styles.cheaterToggle} ${cheaterMode ? styles.cheaterActive : ""}`}
          onClick={() => dispatch({ type: ACTIONS.TOGGLE_CHEATER })}
        >
          {cheaterMode ? "Cheater: ON" : "Cheater: OFF"}
        </button>
      </div>

      {dealSequence.length > 0 && (
        <div className={styles.dealTimeline}>
          <div className={styles.cardPickerLabel} style={{ marginTop: 0 }}>Deal Order</div>
          <div className={styles.timelineChips}>
            {dealSequence.map((d, i) => (
              <span key={d.seq} className={`${styles.timelineChip} ${
                d.cardType === "modifier" ? styles.timelineMod :
                d.cardType === "action" ? styles.timelineAction : ""
              }`}>
                <span className={styles.seqNum}>{i + 1}.</span>
                {getPlayerInitial(d.playerId)}: {d.cardValue}
              </span>
            ))}
          </div>
        </div>
      )}

      {game.players.map(p => {
        const pd = playerData[p.id];
        const isExpanded = expandedPlayer === p.id;
        const busted = hasDuplicateNumbers(pd.numberCards);
        const result = calculateScore(pd.numberCards, pd.modifiers, busted);

        return (
          <div key={p.id} className={`${styles.playerSection} ${isExpanded ? styles.active : ""} ${busted ? styles.bustedSection : ""}`}>
            <div className={styles.playerHeader} onClick={() => setExpandedPlayer(isExpanded ? null : p.id)}>
              <div className={styles.playerName}>{p.name}</div>
              <div className={`${styles.playerScore} ${busted ? styles.bust : ""}`}>
                {busted ? "BUST" : result.total}
              </div>
            </div>

            {isExpanded && (
              <div className="fade-in">
                {busted && (
                  <div className={styles.bustBanner}>
                    Busted — duplicate number card! Remove a duplicate to continue.
                  </div>
                )}

                {cheaterMode && !busted && pd.numberCards.length > 0 && (() => {
                  const dealt = getAdjustedDealt();
                  const { bustChance, bustCards, totalRemaining } = calculateBustChance(pd.numberCards, dealt, playerData);
                  return (
                    <div className={`${styles.bustChanceBanner} ${
                      bustChance >= 75 ? styles.bustDanger :
                      bustChance >= 50 ? styles.bustWarning :
                      bustChance >= 25 ? styles.bustCaution :
                      styles.bustSafe
                    }`}>
                      <div className={styles.bustChanceValue}>{bustChance.toFixed(1)}%</div>
                      <div className={styles.bustChanceLabel}>
                        bust chance ({bustCards} / {totalRemaining} cards)
                      </div>
                    </div>
                  );
                })()}

                <div className={styles.cardPickerLabel}>Number Cards {!busted && pd.numberCards.length === 7 && "🎯 FLIP 7!"}</div>
                <div className={styles.cardPicker}>
                  {Array.from({ length: 13 }, (_, i) => {
                    const count = pd.numberCards.filter(c => c === i).length;
                    const atFlip7 = pd.numberCards.length >= 7;
                    return (
                      <div
                        key={i}
                        className={`${styles.pickCard} ${count > 0 ? styles.selected : ""} ${count >= 2 ? styles.maxed : ""} ${atFlip7 && count === 0 ? styles.flip7Locked : ""}`}
                        onClick={() => attemptAddCard(p.id, "number", i)}
                      >
                        {i}
                        {count > 1 && <span className={styles.cardCountBadge}>{count}</span>}
                      </div>
                    );
                  })}
                </div>

                {pd.numberCards.length > 0 && (
                  <div className={styles.selectedCards}>
                    {pd.numberCards.map((c, i) => (
                      <span key={i} className={styles.selectedChip}>
                        {c}
                        <span className={styles.chipRemove} onClick={(e) => {
                          e.stopPropagation();
                          removeCard(p.id, "number", i);
                        }}>×</span>
                      </span>
                    ))}
                  </div>
                )}

                <div className={styles.cardPickerLabel}>Modifiers</div>
                <div className={styles.cardPicker}>
                  {Object.keys(DECK.modifiers).map(mod => {
                    const count = pd.modifiers.filter(m => m === mod).length;
                    return (
                      <div
                        key={mod}
                        className={`${styles.pickCard} ${styles.modifier} ${count > 0 ? styles.selected : ""}`}
                        onClick={() => attemptAddCard(p.id, "modifier", mod)}
                      >
                        {mod}
                        {count > 1 && <span className={styles.cardCountBadge}>{count}</span>}
                      </div>
                    );
                  })}
                </div>

                {pd.modifiers.length > 0 && (
                  <div className={styles.selectedCards}>
                    {pd.modifiers.map((m, i) => (
                      <span key={i} className={`${styles.selectedChip} ${styles.modChip}`}>
                        {m}
                        <span className={styles.chipRemove} onClick={(e) => {
                          e.stopPropagation();
                          removeCard(p.id, "modifier", i);
                        }}>×</span>
                      </span>
                    ))}
                  </div>
                )}

                <div className={styles.cardPickerLabel}>Action Cards (for deck tracking)</div>
                <div className={styles.cardPicker}>
                  {Object.keys(DECK.actions).map(action => {
                    const count = pd.actions.filter(a => a === action).length;
                    return (
                      <div
                        key={action}
                        className={`${styles.pickCard} ${styles.action} ${count > 0 ? styles.selected : ""}`}
                        onClick={() => attemptAddCard(p.id, "action", action)}
                      >
                        {action}
                        {count > 1 && <span className={styles.cardCountBadge}>{count}</span>}
                      </div>
                    );
                  })}
                </div>

                {pd.actions.length > 0 && (
                  <div className={styles.selectedCards}>
                    {pd.actions.map((a, i) => (
                      <span key={i} className={`${styles.selectedChip} ${styles.actionChip}`}>
                        {a}
                        <span className={styles.chipRemove} onClick={(e) => {
                          e.stopPropagation();
                          removeCard(p.id, "action", i);
                        }}>×</span>
                      </span>
                    ))}
                  </div>
                )}

                <div className={styles.scoreBreakdown}>{result.breakdown}</div>
              </div>
            )}
          </div>
        );
      })}

      <div className={styles.roundActions}>
        <button className="btn btn-secondary btn-small" onClick={handleCancel}>Cancel</button>
        <button className="btn btn-primary btn-small" onClick={handleSave} style={{ flex: 1 }}>
          {isEdit ? "Update Round" : "Save Round"}
        </button>
      </div>

      {cardWarning && (
        <ConfirmDialog
          title="Card Unavailable"
          message={
            <div>
              <p style={{ color: "var(--text)", fontWeight: 600, marginBottom: 8 }}>
                {cardWarning.cardType === "number" ? `Card "${cardWarning.cardValue}"` : `"${cardWarning.cardValue}"`} has 0 remaining in the deck.
              </p>
              <p style={{ fontSize: 12, color: "var(--text-dim)" }}>
                All copies have been dealt in previous rounds or to other players this round.
                If the physical deck disagrees, you can override this check.
              </p>
            </div>
          }
          confirmLabel="Add Anyway"
          cancelLabel="Cancel"
          variant="warning"
          onConfirm={() => {
            commitCard(cardWarning.playerId, cardWarning.cardType, cardWarning.cardValue);
            setCardWarning(null);
          }}
          onCancel={() => setCardWarning(null)}
        />
      )}

      {showShufflePrompt && (
        <ConfirmDialog
          title="Deck Depleted"
          message={
            <div>
              <p style={{ color: "var(--text)", fontWeight: 600, marginBottom: 8 }}>
                All remaining cards in the deck have been dealt.
              </p>
              <p style={{ fontSize: 12, color: "var(--text-dim)" }}>
                If the physical deck was reshuffled, confirm below. Cards held by players in this round will remain out of the shuffled deck.
              </p>
            </div>
          }
          confirmLabel="Shuffle Deck"
          cancelLabel="Not Yet"
          onConfirm={() => {
            dispatch({ type: ACTIONS.RESET_DECK });
            setShowShufflePrompt(false);
            shufflePromptShown.current = false;
          }}
          onCancel={() => setShowShufflePrompt(false)}
        />
      )}
    </div>
  );
}
