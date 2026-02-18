import { DECK } from "../constants/deck";

export function buildDeck() {
  const cards = [];
  for (const [value, count] of Object.entries(DECK.numbers)) {
    for (let i = 0; i < count; i++) {
      cards.push({ type: "number", value: Number(value) });
    }
  }
  for (const [value, count] of Object.entries(DECK.modifiers)) {
    for (let i = 0; i < count; i++) {
      cards.push({ type: "modifier", value });
    }
  }
  for (const [value, count] of Object.entries(DECK.actions)) {
    for (let i = 0; i < count; i++) {
      cards.push({ type: "action", value });
    }
  }
  return cards;
}

export function shuffleDeck(cards) {
  const a = [...cards];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createShuffledDeck() {
  return shuffleDeck(buildDeck());
}
