import { useGame } from "../../context/GameContext";
import { ACTIONS } from "../../context/gameReducer";
import { getPlayerTotal } from "../../utils/helpers";
import styles from "./PlayerDetail.module.css";

export default function PlayerDetail() {
  const { game, selectedPlayer, dispatch } = useGame();
  const player = game.players.find(p => p.id === selectedPlayer);

  if (!player) {
    dispatch({ type: ACTIONS.NAVIGATE, payload: { screen: "game" } });
    return null;
  }

  const total = getPlayerTotal(game, player.id);

  return (
    <div className={`app ${styles.playerDetail} fade-in`}>
      <button className={styles.backBtn} onClick={() => dispatch({ type: ACTIONS.NAVIGATE, payload: { screen: "game" } })}>← Scoreboard</button>
      <div className={styles.header}>
        <div className={styles.name}>{player.name}</div>
        <div className={styles.total}>{total}</div>
      </div>
      {game.rounds.length === 0 && (
        <p style={{ color: "var(--text-dim)", textAlign: "center", padding: 40 }}>No rounds played yet</p>
      )}
      {game.rounds.map((round, i) => {
        const r = round.playerResults[player.id];
        if (!r) return null;
        const cards = r.busted ? "Busted" : [
          ...(r.numberCards || []).map(String),
          ...(r.modifiers || []),
        ].join(", ") || "No cards";
        return (
          <div
            key={i}
            className={styles.roundHistoryItem}
            onClick={() => dispatch({ type: ACTIONS.NAVIGATE, payload: { screen: "round", editingRound: i, playerId: player.id } })}
          >
            <div>
              <div className={styles.round}>Round {i + 1}</div>
              <div className={styles.cards}>{cards}{r.flip7 ? " 🎯 Flip 7!" : ""}</div>
            </div>
            <div className={`${styles.score} ${r.score > 0 ? styles.positive : styles.zero}`}>
              {r.busted ? "0" : `+${r.score}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
