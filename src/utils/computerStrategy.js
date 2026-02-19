import { calculateBustChance } from "./bustCalculator";
import { calculateScore } from "./scoring";
import { getPlayerTotal } from "./helpers";

/**
 * Decide whether a computer player should hit or stand.
 * Returns "hit" or "stand".
 */
export function decideAction({ playerId, hand, dealt, allPlayerData, game }) {
  // Always hit with 0 cards
  if (hand.numberCards.length === 0 && hand.modifiers.length === 0 && hand.actions.length === 0) {
    return "hit";
  }

  // Always hit with Second Chance active — zero downside
  if (hand.hasSecondChance) {
    return "hit";
  }

  const { bustChance } = calculateBustChance(hand.numberCards, dealt, allPlayerData);
  const result = calculateScore(hand.numberCards, hand.modifiers, false);
  const myTotal = getPlayerTotal(game, playerId);

  const cardCount = hand.numberCards.length + hand.modifiers.length + hand.actions.length;

  // Early-hand auto-hit: with ≤1 card and reasonable bust chance, always hit
  if (cardCount <= 1 && bustChance < 60) {
    return "hit";
  }

  // Base threshold: stand if bust chance >= threshold
  let threshold = 35;

  // Card count modifier: chase Flip 7
  if (cardCount >= 6) threshold += 12;
  else if (cardCount >= 5) threshold += 6;

  // Hand score modifier
  if (result.total <= 5) threshold += 10;
  else if (result.total >= 30) threshold -= 10;
  else if (result.total >= 20) threshold -= 5;

  // Game position modifiers
  const opponents = game.players.filter(p => p.id !== playerId);
  if (opponents.length > 0) {
    const opponentTotals = opponents.map(p => getPlayerTotal(game, p.id));
    const maxOpponent = Math.max(...opponentTotals);

    // Far behind: play more aggressively
    if (maxOpponent - myTotal > 50) threshold += 10;
    // Somewhat behind
    else if (maxOpponent - myTotal > 20) threshold += 5;
    // Well ahead: play more conservatively
    if (myTotal - maxOpponent > 30) threshold -= 8;

    // Opponent close to winning
    if (opponentTotals.some(t => t >= 170)) threshold += 8;
  }

  // Current-round awareness
  const playRound = game.playRound;
  if (playRound && playRound.playerHands) {
    const opponentIds = opponents.map(p => p.id);
    const opponentHands = opponentIds
      .map(id => playRound.playerHands[id])
      .filter(Boolean);

    if (opponentHands.length > 0) {
      const bustedCount = opponentHands.filter(h => h.busted).length;
      const doneOpponents = opponentHands.filter(h => h.busted || h.stood);

      // Most opponents busted — protect our score
      if (bustedCount > opponentHands.length / 2) {
        threshold -= 10;
      }
      // All opponents done — check if we need to catch up
      else if (doneOpponents.length === opponentHands.length) {
        const bestOpponentRoundScore = Math.max(
          ...doneOpponents
            .filter(h => !h.busted)
            .map(h => calculateScore(h.numberCards, h.modifiers, false).total),
          0
        );
        if (bestOpponentRoundScore - result.total >= 10) {
          threshold += 8;
        }
      }
    }
  }

  // Clamp threshold
  threshold = Math.max(20, Math.min(65, threshold));

  return bustChance >= threshold ? "stand" : "hit";
}

/**
 * Choose a target for Flip Three.
 * Picks the opponent with the highest cumulative score (punish the leader).
 */
export function chooseFlipThreeTarget(chooserId, playingPlayerIds, game) {
  const opponents = playingPlayerIds.filter(pid => pid !== chooserId);
  if (opponents.length === 0) return chooserId;

  let bestTarget = opponents[0];
  let bestScore = getPlayerTotal(game, opponents[0]);

  for (let i = 1; i < opponents.length; i++) {
    const score = getPlayerTotal(game, opponents[i]);
    if (score > bestScore) {
      bestScore = score;
      bestTarget = opponents[i];
    }
  }

  return bestTarget;
}

/**
 * Choose a target for gifting a Second Chance.
 * Gives to the opponent with the lowest cumulative score (least threatening).
 */
export function chooseSecondChanceTarget(eligiblePlayerIds, game) {
  if (eligiblePlayerIds.length === 1) return eligiblePlayerIds[0];

  let bestTarget = eligiblePlayerIds[0];
  let bestScore = getPlayerTotal(game, eligiblePlayerIds[0]);

  for (let i = 1; i < eligiblePlayerIds.length; i++) {
    const score = getPlayerTotal(game, eligiblePlayerIds[i]);
    if (score < bestScore) {
      bestScore = score;
      bestTarget = eligiblePlayerIds[i];
    }
  }

  return bestTarget;
}
