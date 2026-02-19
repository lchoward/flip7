/**
 * Merge a player's hand with its cancelledCards, returning a flat
 * { numberCards, modifiers, actions } shape suitable for deck-remaining
 * calculations and round-end scoring.
 */
export function flattenHandWithCancelled(hand) {
  const cancelled = hand.cancelledCards || [];
  return {
    numberCards: [...hand.numberCards, ...cancelled.filter(c => c.type === "number").map(c => c.value)],
    modifiers: [...hand.modifiers, ...cancelled.filter(c => c.type === "modifier").map(c => c.value)],
    actions: [...hand.actions, ...cancelled.filter(c => c.type === "action").map(c => c.value)],
  };
}
