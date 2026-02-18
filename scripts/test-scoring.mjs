import { calculateScore, hasDuplicateNumbers } from "../src/utils/scoring.js";

let passed = 0;
let failed = 0;

function test(num, description, numberCards, modifiers, busted, expectedTotal, extraChecks = null) {
  const result = calculateScore(numberCards, modifiers, busted);
  if (result.total !== expectedTotal) {
    console.log(`  FAIL: Test ${num} — ${description}: expected ${expectedTotal}, got ${result.total}`);
    failed++;
  } else if (extraChecks) {
    const failures = [];
    for (const [key, expected] of Object.entries(extraChecks)) {
      if (result[key] !== expected) {
        failures.push(`${key}: expected ${expected}, got ${result[key]}`);
      }
    }
    if (failures.length > 0) {
      console.log(`  FAIL: Test ${num} — ${description}: total OK but ${failures.join(", ")}`);
      failed++;
    } else {
      console.log(`  Pass: Test ${num} — ${description} = ${expectedTotal}`);
      passed++;
    }
  } else {
    console.log(`  Pass: Test ${num} — ${description} = ${expectedTotal}`);
    passed++;
  }
}

function testDup(input, expected) {
  const result = hasDuplicateNumbers(input);
  if (result !== expected) {
    console.log(`  FAIL: hasDuplicateNumbers([${input}]) — expected ${expected}, got ${result}`);
    failed++;
  } else {
    console.log(`  Pass: hasDuplicateNumbers([${input}]) = ${expected}`);
    passed++;
  }
}

console.log("Flip 7 Score Calculator Tests");
console.log("==============================\n");

console.log("--- Basic scoring ---");
test(1, "empty hand", [], [], false, 0);
test(2, "single card", [5], [], false, 5);
test(3, "simple sum", [3, 5, 7], [], false, 15);
test(4, "zero card", [0], [], false, 0);
test(5, "highest number", [12], [], false, 12);
test(6, "seven cards = flip7", [1, 2, 3, 4, 5, 6, 7], [], false, 43);

console.log("\n--- Busting ---");
test(7, "explicit bust", [3, 5, 7], [], true, 0);
test(8, "duplicate numbers", [3, 3], [], false, 0);
test(9, "triple duplicate", [5, 5, 5], [], false, 0);
test(10, "duplicate zeros", [0, 0], [], false, 0);
test(11, "bust ignores modifiers", [3, 5, 3], ["+4"], false, 0);

console.log("\n--- Modifiers ---");
test(12, "plus-two", [3, 5], ["+2"], false, 10);
test(13, "plus-four", [3, 5], ["+4"], false, 12);
test(14, "plus-six", [3, 5], ["+6"], false, 14);
test(15, "plus-eight", [3, 5], ["+8"], false, 16);
test(16, "plus-ten", [3, 5], ["+10"], false, 18);
test(17, "doubler", [3, 5], ["×2"], false, 16);
test(18, "doubler + bonus", [3, 5], ["×2", "+4"], false, 20, {
  numberSum: 8, doubled: true, modifierBonus: 4, flip7: false
});
test(19, "multiple bonuses", [10], ["+2", "+4", "+6"], false, 22);
test(20, "doubler + bonuses", [1, 2], ["×2", "+2", "+4"], false, 12);

console.log("\n--- Flip 7 bonus ---");
test(21, "flip7 low cards", [0, 1, 2, 3, 4, 5, 6], [], false, 36);
test(22, "flip7 high cards", [6, 7, 8, 9, 10, 11, 12], [], false, 78);
test(23, "flip7 + doubler", [0, 1, 2, 3, 4, 5, 6], ["×2"], false, 57, {
  numberSum: 21, doubled: true, modifierBonus: 0, flip7: true
});
test(24, "flip7 + doubler + bonus", [0, 1, 2, 3, 4, 5, 6], ["+10", "×2"], false, 67);
test(25, "six cards no flip7", [1, 2, 3, 4, 5, 6], [], false, 21);
test(26, "eight cards no flip7", [0, 1, 2, 3, 4, 5, 6, 7], [], false, 28);

console.log("\n--- hasDuplicateNumbers ---");
testDup([], false);
testDup([5], false);
testDup([3, 5, 7], false);
testDup([3, 3], true);
testDup([1, 2, 3, 2], true);
testDup([0, 0], true);

console.log(`\n==============================`);
console.log(`Results: ${passed}/${passed + failed} passed, ${failed} failed`);
if (failed === 0) {
  console.log("All tests passed!");
}
