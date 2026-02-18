import { useGame } from "../../context/GameContext";
import styles from "./GameHistory.module.css";

export default function GameHistory() {
  const { game } = useGame();

  if (!game || game.rounds.length === 0) {
    return (
      <div className={styles.panel}>
        <div className={styles.title}>Round History</div>
        <div className={styles.empty}>No rounds played yet</div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.title}>Round History</div>
      {game.rounds.map((round, i) => (
        <div key={i} className={styles.roundRow}>
          <div className={styles.roundNumber}>R{i + 1}</div>
          <div className={styles.roundPlayers}>
            {game.players.map((p) => {
              const result = round.playerResults[p.id];
              if (!result) return null;
              return (
                <span key={p.id} className={`${styles.playerChip} ${result.busted ? styles.busted : ""}`}>
                  {p.name}: {result.busted ? "Bust" : result.score}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
