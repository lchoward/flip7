import { useGame } from "../../context/GameContext";
import { ACTIONS } from "../../context/gameReducer";
import { getPlayerTotal } from "../../utils/helpers";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import DeckTracker from "../DeckTracker/DeckTracker";
import styles from "./GameScreen.module.css";

export default function GameScreen() {
  const { game, sortedPlayers, winner, deckOpen, dialog, getEffectiveDealtCards, dispatch } = useGame();
  const dealt = getEffectiveDealtCards();

  const resetDeck = () => {
    dispatch({
      type: ACTIONS.SET_DIALOG,
      payload: {
        title: "Reset Deck Tracker?",
        message: "This marks the deck as reshuffled. Card counts will reset but scores remain.",
        onConfirm: () => {
          dispatch({ type: ACTIONS.RESET_DECK });
        },
        onCancel: () => dispatch({ type: ACTIONS.SET_DIALOG, payload: null }),
      },
    });
  };

  return (
    <>
      <div className="app fade-in">
        <div className={styles.gameHeader}>
          <div className={styles.gameTitle}>FLIP 7</div>
          <div className={styles.roundBadge}>
            {game.rounds.length === 0 ? "No rounds yet" : `Round ${game.rounds.length} complete`}
          </div>
        </div>

        {winner && (
          <div className={styles.winnerBanner}>
            <h3>🏆 {winner.name} Wins!</h3>
            <p>{getPlayerTotal(game, winner.id)} points</p>
          </div>
        )}

        <div className={styles.scoreboard}>
          {sortedPlayers.map((p, i) => {
            const total = getPlayerTotal(game, p.id);
            const lastRound = game.rounds.length > 0
              ? game.rounds[game.rounds.length - 1].playerResults[p.id]
              : null;
            return (
              <div
                key={p.id}
                className={`${styles.playerRow} ${i === 0 && total > 0 ? styles.leader : ""}`}
                onClick={() => dispatch({ type: ACTIONS.NAVIGATE, payload: "detail", playerId: p.id })}
              >
                <div className={`${styles.rank} ${i === 0 && total > 0 ? styles.gold : ""}`}>{i + 1}</div>
                <div className={styles.playerInfo}>
                  <div className={styles.playerName}>{p.name}</div>
                  {lastRound && (
                    <div className={styles.playerLastRound}>
                      Last: {lastRound.busted ? "Bust" : `+${lastRound.score}`}
                    </div>
                  )}
                </div>
                <div className={styles.playerScore}>{total}</div>
                <div className={styles.arrowIcon}>›</div>
              </div>
            );
          })}
        </div>

        <div className={styles.actionBar}>
          <button className="btn btn-primary btn-small" onClick={() => dispatch({ type: ACTIONS.NAVIGATE, payload: "round" })}>
            + New Round
          </button>
          <button className="btn btn-secondary btn-small" onClick={() => dispatch({ type: ACTIONS.NAVIGATE, payload: "home" })}>Menu</button>
        </div>

        <DeckTracker
          dealt={dealt}
          deckOpen={deckOpen}
          onToggle={() => dispatch({ type: ACTIONS.TOGGLE_DECK })}
          lastReshuffle={game.lastReshuffle}
          onReset={resetDeck}
        />
      </div>
      {dialog && <ConfirmDialog {...dialog} />}
    </>
  );
}
