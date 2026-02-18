import { useGame } from "../../context/GameContext";
import { ACTIONS } from "../../context/gameReducer";
import { uid } from "../../utils/helpers";
import { createShuffledDeck } from "../../utils/deckBuilder";
import styles from "./SetupScreen.module.css";

const MAX_PLAYERS = 12;

export default function SetupScreen() {
  const { game, dispatch } = useGame();

  const isPlayMode = game.mode === "play";

  const updateGame = (updates) => {
    dispatch({ type: ACTIONS.SET_GAME, payload: { ...game, ...updates } });
  };

  const addPlayer = () => {
    if (game.players.length >= MAX_PLAYERS) return;
    updateGame({ players: [...game.players, { id: uid(), name: "" }] });
  };

  const startGame = () => {
    const cleaned = {
      ...game,
      players: game.players.map(p => ({ ...p, name: p.name.trim() })),
    };
    if (isPlayMode) {
      cleaned.deck = createShuffledDeck();
      cleaned.dealerIndex = 0;
      cleaned.playRound = null;
      cleaned.tiebreaker = null;
    }
    dispatch({ type: ACTIONS.SET_GAME, payload: cleaned });
    dispatch({ type: ACTIONS.NAVIGATE, payload: "game" });
  };

  return (
    <div className={`app ${styles.setup} fade-in`}>
      <h2>Game Setup</h2>

      <div className={styles.modeToggle}>
        <button
          className={`${styles.modeBtn} ${!isPlayMode ? styles.modeActive : ""}`}
          onClick={() => updateGame({ mode: "tracker" })}
        >
          Score Tracker
        </button>
        <button
          className={`${styles.modeBtn} ${isPlayMode ? styles.modeActive : ""}`}
          onClick={() => updateGame({ mode: "play" })}
        >
          Play Mode
        </button>
      </div>

      <p className={styles.setupSub}>
        {isPlayMode
          ? "Add 2-12 players — the app will deal cards"
          : "Add 2 or more players to start"}
      </p>

      {game.players.map((p, i) => (
        <div key={p.id} className={styles.playerInputRow}>
          <div className={styles.playerNum}>{i + 1}</div>
          <input
            value={p.name}
            onChange={e => {
              const players = [...game.players];
              players[i] = { ...players[i], name: e.target.value };
              updateGame({ players });
            }}
            placeholder={`Player ${i + 1}`}
            autoFocus={i === game.players.length - 1}
            onKeyDown={e => {
              if (e.key === "Enter") addPlayer();
            }}
          />
          {game.players.length > 2 && (
            <button className={styles.removeBtn} onClick={() => {
              updateGame({ players: game.players.filter((_, j) => j !== i) });
            }}>×</button>
          )}
        </div>
      ))}

      {game.players.length >= MAX_PLAYERS && (
        <div className={styles.maxWarning}>Maximum {MAX_PLAYERS} players reached</div>
      )}

      <div className={styles.setupActions}>
        {game.players.length < MAX_PLAYERS && (
          <button className="btn btn-secondary btn-small" onClick={addPlayer}>
            + Add Player
          </button>
        )}
        <button
          className="btn btn-primary btn-small"
          disabled={game.players.length < 2 || game.players.some(p => !p.name.trim())}
          onClick={startGame}
        >
          {isPlayMode ? "Start Playing →" : "Start Game →"}
        </button>
      </div>
      <button className="btn btn-ghost" onClick={() => dispatch({ type: ACTIONS.NAVIGATE, payload: "home" })} style={{ marginTop: 16 }}>← Back</button>
    </div>
  );
}
