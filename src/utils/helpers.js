export const uid = () => Math.random().toString(36).slice(2, 9);

export function newGame(mode = "play") {
  const base = { id: uid(), players: [], rounds: [], createdAt: Date.now(), mode };
  if (mode === "play") {
    base.deck = [];
    base.dealerIndex = 0;
    base.playRound = null;
    base.tiebreaker = null;
  }
  return base;
}

export function getPlayerTotal(game, playerId) {
  return game.rounds.reduce((sum, round) => {
    const r = round.playerResults[playerId];
    return sum + (r ? r.score : 0);
  }, 0);
}
