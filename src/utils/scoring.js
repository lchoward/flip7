export function hasDuplicateNumbers(numberCards) {
  const seen = new Set();
  for (const c of numberCards) {
    if (seen.has(c)) return true;
    seen.add(c);
  }
  return false;
}

export function calculateScore(numberCards, modifiers, busted) {
  if (busted || hasDuplicateNumbers(numberCards)) return { total: 0, numberSum: 0, doubled: false, modifierBonus: 0, flip7: false, breakdown: "Busted! 0 pts" };
  const numberSum = numberCards.reduce((s, c) => s + c, 0);
  const hasX2 = modifiers.includes("×2");
  const doubled = hasX2 ? numberSum * 2 : numberSum;
  const modifierBonus = modifiers.filter(m => m !== "×2").reduce((s, m) => s + parseInt(m.replace("+", "")), 0);
  const flip7 = numberCards.length === 7;
  const total = doubled + modifierBonus + (flip7 ? 15 : 0);

  let breakdown = `Cards: ${numberSum}`;
  if (hasX2) breakdown += ` → ×2 = ${doubled}`;
  if (modifierBonus > 0) breakdown += ` + ${modifierBonus} bonus`;
  if (flip7) breakdown += ` + 15 (Flip 7!)`;
  breakdown += ` = ${total}`;

  return { total, numberSum, doubled: hasX2, modifierBonus, flip7, breakdown };
}
