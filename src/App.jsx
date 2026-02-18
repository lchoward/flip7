import { GameProvider, useGame } from "./context/GameContext";
import HomeScreen from "./components/HomeScreen/HomeScreen";
import SetupScreen from "./components/SetupScreen/SetupScreen";
import GameScreen from "./components/GameScreen/GameScreen";
import RoundEntry from "./components/RoundEntry/RoundEntry";
import PlayerDetail from "./components/PlayerDetail/PlayerDetail";
import PlayGameScreen from "./components/PlayGameScreen/PlayGameScreen";
import PlayRound from "./components/PlayRound/PlayRound";

function AppContent() {
  const { screen, game, loading } = useGame();

  if (loading) {
    return (
      <div className="app" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 72, fontWeight: 700, background: "linear-gradient(135deg, var(--primary), var(--accent))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>FLIP 7</div>
        <p style={{ color: "var(--text-dim)" }}>Loading...</p>
      </div>
    );
  }

  const isPlayMode = game?.mode === "play";

  return (
    <>
      {screen === "home" && <HomeScreen />}
      {screen === "setup" && <SetupScreen />}
      {screen === "game" && (isPlayMode ? <PlayGameScreen /> : <GameScreen />)}
      {screen === "round" && (isPlayMode ? <PlayRound /> : <RoundEntry />)}
      {screen === "detail" && <PlayerDetail />}
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}
