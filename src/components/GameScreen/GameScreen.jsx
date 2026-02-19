import { useState } from "react";
import { useGame } from "../../context/GameContext";
import { ACTIONS } from "../../context/gameReducer";
import { getPlayerTotal } from "../../utils/helpers";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import DeckTracker from "../DeckTracker/DeckTracker";

export default function GameScreen() {
  const { game, sortedPlayers, winner, deckOpen, getEffectiveDealtCards, dispatch } = useGame();
  const dealt = getEffectiveDealtCards();
  const [confirmDialog, setConfirmDialog] = useState(null);

  const resetDeck = () => {
    setConfirmDialog({
      title: "Reset Deck Tracker?",
      message: "This marks the deck as reshuffled. Card counts will reset but scores remain.",
      onConfirm: () => {
        dispatch({ type: ACTIONS.RESET_DECK });
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  return (
    <>
      <div className="app fade-in">
        <div className="gameHeader">
          <div className="gameTitle">FLIP 7</div>
          <div className="roundBadge">
            {game.rounds.length === 0 ? "No rounds yet" : `Round ${game.rounds.length} complete`}
          </div>
        </div>

        {winner && (
          <div className="winnerBanner">
            <h3>{winner.name} Wins!</h3>
            <p>{getPlayerTotal(game, winner.id)} points</p>
          </div>
        )}

        <div className="scoreboard">
          {sortedPlayers.map((p, i) => {
            const total = getPlayerTotal(game, p.id);
            const lastRound = game.rounds.length > 0
              ? game.rounds[game.rounds.length - 1].playerResults[p.id]
              : null;
            return (
              <div
                key={p.id}
                className={`playerRow ${i === 0 && total > 0 ? "leader" : ""}`}
                onClick={() => dispatch({ type: ACTIONS.NAVIGATE, payload: { screen: "detail", playerId: p.id } })}
              >
                <div className={`rank ${i === 0 && total > 0 ? "gold" : ""}`}>{i + 1}</div>
                <div className="playerInfo">
                  <div className="scoreboardPlayerName">{p.name}</div>
                  {lastRound && (
                    <div className="playerLastRound">
                      Last: {lastRound.busted ? "Bust" : `+${lastRound.score}`}
                    </div>
                  )}
                </div>
                <div className="scoreboardPlayerScore">{total}</div>
                <div className="arrowIcon">›</div>
              </div>
            );
          })}
        </div>

        <div className="actionBar">
          <button className="btn btn-primary btn-small" onClick={() => dispatch({ type: ACTIONS.NAVIGATE, payload: { screen: "round" } })}>
            + New Round
          </button>
          <button className="btn btn-secondary btn-small" onClick={() => dispatch({ type: ACTIONS.NAVIGATE, payload: { screen: "home" } })}>Menu</button>
        </div>

        <DeckTracker
          dealt={dealt}
          deckOpen={deckOpen}
          onToggle={() => dispatch({ type: ACTIONS.TOGGLE_DECK })}
          lastReshuffle={game.lastReshuffle}
          onReset={resetDeck}
        />
      </div>
      {confirmDialog && <ConfirmDialog {...confirmDialog} />}
    </>
  );
}
