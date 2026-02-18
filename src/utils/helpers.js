import { DECK } from "../constants/deck";

export const uid = () => Math.random().toString(36).slice(2, 9);

export function newGame(mode = "tracker") {
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

export function getDealtCards(game) {
  const dealt = { numbers: {}, modifiers: {}, actions: {} };
  for (let i = 0; i <= 12; i++) dealt.numbers[i] = 0;
  Object.keys(DECK.modifiers).forEach(k => dealt.modifiers[k] = 0);
  Object.keys(DECK.actions).forEach(k => dealt.actions[k] = 0);

  game.rounds.forEach(round => {
    Object.values(round.playerResults).forEach(r => {
      (r.numberCards || []).forEach(c => { dealt.numbers[c] = (dealt.numbers[c] || 0) + 1; });
      (r.modifiers || []).forEach(m => { dealt.modifiers[m] = (dealt.modifiers[m] || 0) + 1; });
      (r.actions || []).forEach(a => { dealt.actions[a] = (dealt.actions[a] || 0) + 1; });
    });
  });
  return dealt;
}

export function getDeckStatus(game) {
  const dealt = getDealtCards(game);
  const totalDeck = Object.values(DECK.numbers).reduce((a, b) => a + b, 0)
    + Object.values(DECK.modifiers).reduce((a, b) => a + b, 0)
    + Object.values(DECK.actions).reduce((a, b) => a + b, 0);
  const totalDealt = Object.values(dealt.numbers).reduce((a, b) => a + b, 0)
    + Object.values(dealt.modifiers).reduce((a, b) => a + b, 0)
    + Object.values(dealt.actions).reduce((a, b) => a + b, 0);
  return { dealt, totalDeck, totalDealt, remaining: totalDeck - totalDealt };
}
