import { useGame } from "../../context/GameContext";
import { ACTIONS } from "../../context/gameReducer";
import { calculateScore } from "../../utils/scoring";
import CardVisual from "../CardVisual/CardVisual";
import styles from "./RoundDetail.module.css";

export default function RoundDetail() {
  const { game, editingRound, selectedPlayer, dispatch } = useGame();
  const round = editingRound !== null ? game.rounds[editingRound] : null;

  if (!round) {
    dispatch({ type: ACTIONS.NAVIGATE, payload: { screen: "game" } });
    return null;
  }

  const goBack = () => {
    dispatch({ type: ACTIONS.NAVIGATE, payload: { screen: "detail", playerId: selectedPlayer } });
  };

  const goEdit = () => {
    dispatch({ type: ACTIONS.NAVIGATE, payload: { screen: "round", editingRound, playerId: selectedPlayer } });
  };

  const getRunningTotal = (playerId, upToRound) => {
    let total = 0;
    for (let i = 0; i <= upToRound; i++) {
      const r = game.rounds[i]?.playerResults[playerId];
      if (r) total += r.score;
    }
    return total;
  };

  const getPlayerInitial = (pid) => {
    const player = game.players.find(p => p.id === pid);
    return player ? player.name.charAt(0).toUpperCase() : "?";
  };

  return (
    <div className={`app ${styles.roundDetail} fade-in`}>
      <button className={styles.backBtn} onClick={goBack}>
        ← Player Detail
      </button>

      <div className={styles.header}>
        <div className={styles.roundTitle}>Round {editingRound + 1}</div>
        <button className={styles.editBtn} onClick={goEdit}>Edit</button>
      </div>

      {game.players.map(p => {
        const r = round.playerResults[p.id];
        if (!r) return null;

        const totalBefore = getRunningTotal(p.id, editingRound - 1);
        const totalAfter = totalBefore + r.score;
        const scoreResult = calculateScore(r.numberCards || [], r.modifiers || [], r.busted);
        const isOrigin = p.id === selectedPlayer;

        return (
          <div key={p.id} className={`${styles.playerSection} ${isOrigin ? styles.highlight : ""}`}>
            <div className={styles.playerHeader}>
              <div className={styles.playerName}>
                {p.name}
                {r.flip7 && <span className={styles.flip7Badge}>Flip 7!</span>}
              </div>
              <div className={styles.scoreInfo}>
                <div className={`${styles.roundScore} ${r.busted ? styles.bust : styles.positive}`}>
                  {r.busted ? "BUST" : `+${r.score}`}
                </div>
                <div className={styles.runningTotal}>
                  {totalBefore} → {totalAfter}
                </div>
              </div>
            </div>

            {(r.numberCards?.length > 0 || r.modifiers?.length > 0 || r.actions?.length > 0) && (
              <div className={styles.cards}>
                {(r.numberCards || []).map((c, i) => (
                  <CardVisual key={`n${i}`} type="number" value={c} small />
                ))}
                {(r.modifiers || []).map((m, i) => (
                  <CardVisual key={`m${i}`} type="modifier" value={m} small />
                ))}
                {(r.actions || []).map((a, i) => (
                  <CardVisual key={`a${i}`} type="action" value={a} small />
                ))}
              </div>
            )}

            {!r.busted && (r.numberCards?.length > 0 || r.modifiers?.length > 0) && (
              <div className={styles.breakdown}>{scoreResult.breakdown}</div>
            )}
          </div>
        );
      })}

      {round.dealOrder?.length > 0 && (
        <div className={styles.dealTimeline}>
          <div className={styles.dealTimelineLabel}>Deal Order</div>
          <div className={styles.timelineChips}>
            {round.dealOrder.map((d, i) => (
              <span key={d.seq ?? i} className={`${styles.timelineChip} ${
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
    </div>
  );
}
