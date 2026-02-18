import { getRemainingCards, getTotalRemaining } from "./deckUtils";

export function calculateBustChance(playerNumberCards, dealtFromPastRounds, allPlayerData) {
  const remaining = getRemainingCards(dealtFromPastRounds, allPlayerData);
  const totalRemaining = getTotalRemaining(remaining);

  // Count dangerous cards: remaining number cards that match numbers the player already has
  const uniqueNumbers = new Set(playerNumberCards);
  let bustCards = 0;
  for (const num of uniqueNumbers) {
    bustCards += remaining.numbers[num] || 0;
  }

  const bustChance = totalRemaining > 0 ? (bustCards / totalRemaining) * 100 : 0;

  return { bustChance, bustCards, totalRemaining };
}
