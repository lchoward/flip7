import { useGame } from "../../context/GameContext";
import { ACTIONS } from "../../context/gameReducer";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import styles from "./HomeScreen.module.css";

export default function HomeScreen() {
  const { game, dialog, dispatch } = useGame();

  const startNewGame = () => {
    dispatch({ type: ACTIONS.START_NEW_GAME });
  };

  const confirmNewGame = () => {
    if (game && game.rounds.length > 0) {
      dispatch({
        type: ACTIONS.SET_DIALOG,
        payload: {
          title: "Start New Game?",
          message: "This will end your current game. Are you sure?",
          onConfirm: () => { dispatch({ type: ACTIONS.SET_DIALOG, payload: null }); startNewGame(); },
          onCancel: () => dispatch({ type: ACTIONS.SET_DIALOG, payload: null }),
        },
      });
    } else {
      startNewGame();
    }
  };

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
            <button className="btn btn-secondary" onClick={() => dispatch({ type: ACTIONS.NAVIGATE, payload: "game" })}>
              Continue Game
            </button>
          )}
        </div>
      </div>
      {dialog && <ConfirmDialog {...dialog} />}
    </>
  );
}
