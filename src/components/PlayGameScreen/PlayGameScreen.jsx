import { useState } from "react";
import { useGame } from "../../context/GameContext";
import { ACTIONS } from "../../context/gameReducer";
import { getPlayerTotal } from "../../utils/helpers";
import { WIN_SCORE } from "../../constants/deck";
import CardVisual from "../CardVisual/CardVisual";
import DeckTracker from "../DeckTracker/DeckTracker";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import styles from "./PlayGameScreen.module.css";

export default function PlayGameScreen() {
  const { game, sortedPlayers, winner, cheaterMode, deckOpen, getEffectiveDealtCards, dispatch } = useGame();
  const dealt = getEffectiveDealtCards();
  const [showLastRound, setShowLastRound] = useState(true);
  const [menuConfirm, setMenuConfirm] = useState(false);

  const dealerIdx = game.dealerIndex || 0;
  const dealerPlayer = game.players[dealerIdx];

  // Tiebreaker detection after a round ends
  const handleNewRound = () => {
    // Check if we need to enter tiebreaker
    if (!winner && !game.tiebreaker) {
      const topScore = sortedPlayers.length > 0 ? getPlayerTotal(game, sortedPlayers[0].id) : 0;
      if (topScore >= WIN_SCORE) {
        const tied = sortedPlayers.filter(p => getPlayerTotal(game, p.id) === topScore);
        if (tied.length > 1) {
          dispatch({
            type: ACTIONS.SET_TIEBREAKER,
            payload: { playerIds: tied.map(p => p.id) },
          });
          // Still start the round — tiebreaker state will filter players
          dispatch({ type: ACTIONS.START_PLAY_ROUND });
          return;
        }
      }
    }

    // If in tiebreaker, check if it's resolved
    if (game.tiebreaker) {
      const tbPlayers = game.tiebreaker.playerIds;
      const tbScores = tbPlayers.map(pid => getPlayerTotal(game, pid));
      const maxTbScore = Math.max(...tbScores);
      const leaders = tbPlayers.filter(pid => getPlayerTotal(game, pid) === maxTbScore);
      if (leaders.length === 1) {
        dispatch({ type: ACTIONS.CLEAR_TIEBREAKER });
        return; // Winner will be detected by context
      }
    }

    dispatch({ type: ACTIONS.START_PLAY_ROUND });
  };

  const lastRound = game.rounds.length > 0 ? game.rounds[game.rounds.length - 1] : null;

  return (
    <>
      <div className="app fade-in">
        <div className={styles.gameHeader}>
          <div className={styles.gameTitle}>FLIP 7</div>
          <div className={styles.roundBadge}>
            {game.rounds.length === 0 ? "Ready to play" : `Round ${game.rounds.length} complete`}
          </div>
        </div>

        <div className={styles.modeBadge}>Play Mode</div>

        {winner && (
          <div className={styles.winnerBanner}>
            <h3>{winner.name} Wins!</h3>
            <p>{getPlayerTotal(game, winner.id)} points</p>
          </div>
        )}

        {game.tiebreaker && !winner && (
          <div className={styles.tiebreakerBanner}>
            Tiebreaker — {game.tiebreaker.playerIds.map(pid =>
              game.players.find(p => p.id === pid)?.name
            ).join(" vs ")}
          </div>
        )}

        <div className={styles.scoreboard}>
          {sortedPlayers.map((p, i) => {
            const total = getPlayerTotal(game, p.id);
            const isDealer = dealerPlayer?.id === p.id;
            const lastResult = lastRound?.playerResults[p.id];

            return (
              <div
                key={p.id}
                className={`${styles.playerRow} ${i === 0 && total > 0 ? styles.leader : ""}`}
                onClick={() => dispatch({ type: ACTIONS.NAVIGATE, payload: "detail", playerId: p.id })}
              >
                <div className={`${styles.rank} ${i === 0 && total > 0 ? styles.gold : ""}`}>{i + 1}</div>
                <div className={styles.playerInfo}>
                  <div className={styles.playerName}>
                    {p.name}
                    {isDealer && <span className={styles.dealerBadge}>D</span>}
                  </div>
                  {lastResult && (
                    <div className={styles.playerLastRound}>
                      Last: {lastResult.busted ? "Bust" : `+${lastResult.score}`}
                    </div>
                  )}
                  {showLastRound && lastResult && lastResult.numberCards.length > 0 && (
                    <div className={styles.lastRoundCards}>
                      {lastResult.numberCards.map((n, ci) => (
                        <CardVisual key={`n-${ci}`} type="number" value={n} small />
                      ))}
                      {lastResult.modifiers.map((m, ci) => (
                        <CardVisual key={`m-${ci}`} type="modifier" value={m} small />
                      ))}
                      {lastResult.actions.map((a, ci) => (
                        <CardVisual key={`a-${ci}`} type="action" value={a} small />
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.playerScore}>{total}</div>
                <div className={styles.arrowIcon}>›</div>
              </div>
            );
          })}
        </div>

        {lastRound && (
          <button
            className="btn btn-ghost btn-small"
            onClick={() => setShowLastRound(!showLastRound)}
            style={{ marginBottom: 8 }}
          >
            {showLastRound ? "Hide cards" : "Show last round cards"}
          </button>
        )}

        <div className={styles.actionBar}>
          {!winner && (
            <button className="btn btn-primary btn-small" onClick={handleNewRound}>
              {game.tiebreaker ? "Tiebreaker Round" : "Deal Next Round"}
            </button>
          )}
          <button className="btn btn-secondary btn-small" onClick={() => setMenuConfirm(true)}>Menu</button>
        </div>

        <div className={styles.deckInfo}>
          {game.deck?.length || 0} cards remaining in deck
          <button
            className={styles.cheaterToggle}
            onClick={() => dispatch({ type: ACTIONS.TOGGLE_CHEATER })}
          >
            {cheaterMode ? "Cheater: ON" : "Cheater: OFF"}
          </button>
        </div>

        {cheaterMode && (
          <DeckTracker
            dealt={dealt}
            deckOpen={deckOpen}
            onToggle={() => dispatch({ type: ACTIONS.TOGGLE_DECK })}
            lastReshuffle={game.lastReshuffle}
            onReset={null}
          />
        )}
      </div>

      {menuConfirm && (
        <ConfirmDialog
          title="Leave Game?"
          message="Your game will be saved and you can continue later."
          confirmLabel="Go to Menu"
          cancelLabel="Stay"
          onConfirm={() => {
            setMenuConfirm(false);
            dispatch({ type: ACTIONS.NAVIGATE, payload: "home" });
          }}
          onCancel={() => setMenuConfirm(false)}
        />
      )}
    </>
  );
}
