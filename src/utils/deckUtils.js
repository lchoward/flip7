import { DECK } from "../constants/deck";

export function getRemainingCards(dealtFromPastRounds, currentRoundPlayerData) {
  const remaining = {
    numbers: { ...DECK.numbers },
    modifiers: { ...DECK.modifiers },
    actions: { ...DECK.actions },
  };

  // Subtract cards dealt in past rounds
  for (const [num, count] of Object.entries(dealtFromPastRounds.numbers)) {
    remaining.numbers[num] = Math.max(0, (remaining.numbers[num] || 0) - count);
  }
  for (const [mod, count] of Object.entries(dealtFromPastRounds.modifiers)) {
    remaining.modifiers[mod] = Math.max(0, (remaining.modifiers[mod] || 0) - count);
  }
  for (const [act, count] of Object.entries(dealtFromPastRounds.actions)) {
    remaining.actions[act] = Math.max(0, (remaining.actions[act] || 0) - count);
  }

  // Subtract cards held by all players in the current round
  for (const pd of Object.values(currentRoundPlayerData)) {
    for (const card of pd.numberCards) {
      remaining.numbers[card] = Math.max(0, (remaining.numbers[card] || 0) - 1);
    }
    for (const mod of pd.modifiers) {
      remaining.modifiers[mod] = Math.max(0, (remaining.modifiers[mod] || 0) - 1);
    }
    for (const act of pd.actions) {
      remaining.actions[act] = Math.max(0, (remaining.actions[act] || 0) - 1);
    }
  }

  return remaining;
}

export function getTotalRemaining(remaining) {
  const nums = Object.values(remaining.numbers).reduce((a, b) => a + b, 0);
  const mods = Object.values(remaining.modifiers).reduce((a, b) => a + b, 0);
  const acts = Object.values(remaining.actions).reduce((a, b) => a + b, 0);
  return nums + mods + acts;
}

export function getCardRemaining(remaining, cardType, cardValue) {
  if (cardType === "number") return remaining.numbers[cardValue] || 0;
  if (cardType === "modifier") return remaining.modifiers[cardValue] || 0;
  if (cardType === "action") return remaining.actions[cardValue] || 0;
  return 0;
}
