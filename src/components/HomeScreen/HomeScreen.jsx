import { useState, useEffect } from "react";
import { useGame } from "../../context/GameContext";
import { ACTIONS } from "../../context/gameReducer";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import HowToPlay from "../HowToPlay/HowToPlay";
import styles from "./HomeScreen.module.css";

export default function HomeScreen() {
  const { game, dispatch } = useGame();
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const startNewGame = () => {
    dispatch({ type: ACTIONS.START_NEW_GAME });
  };

  const confirmNewGame = () => {
    if (game && game.rounds.length > 0) {
      setConfirmDialog({
        title: "Start New Game?",
        message: "This will end your current game. Are you sure?",
        onConfirm: () => { setConfirmDialog(null); startNewGame(); },
        onCancel: () => setConfirmDialog(null),
      });
    } else {
      startNewGame();
    }
  };

  // Keyboard shortcut: Enter = New Game
  useEffect(() => {
    const handleKey = (e) => {
      if (confirmDialog || showHowToPlay) return;
      if (e.key === "Enter") {
        confirmNewGame();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [confirmDialog, game, showHowToPlay]);

  return (
    <>
      <div className={`app ${styles.home} fade-in`}>
        <div className={styles.logo}>FLIP 7</div>
        <div className={styles.logoSub}>Scorekeeper</div>
        <div className={styles.homeCards}>
          {[3, 7, 11, 5, 9].map((n, i) => (
            <div key={n} className={styles.miniCard} style={{
              background: `hsl(${n * 28}, 70%, 50%)`,
              "--rot": `${(i - 2) * 8}deg`,
            }}>{n}</div>
          ))}
        </div>
        <div className={styles.buttonGroup}>
          <button className="btn btn-primary" onClick={confirmNewGame}>New Game</button>
          {game && game.players.length > 0 && (
            <button className="btn btn-secondary" onClick={() => dispatch({ type: ACTIONS.NAVIGATE, payload: { screen: "game" } })}>
              Continue Game
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => setShowHowToPlay(true)}>How to Play</button>
        </div>
      </div>
      {confirmDialog && <ConfirmDialog {...confirmDialog} />}
      {showHowToPlay && <HowToPlay onClose={() => setShowHowToPlay(false)} />}
    </>
  );
}
