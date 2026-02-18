import { calculateScore } from "../src/utils/scoring.js";

const uid = () => Math.random().toString(36).slice(2, 9);

function makePlayerResult(numberCards, modifiers = [], actions = [], busted = false) {
  const result = calculateScore(numberCards, modifiers, busted);
  return {
    numberCards,
    modifiers,
    actions,
    busted: busted || result.total === 0 && numberCards.length > 0,
    score: result.total,
    flip7: result.flip7,
  };
}

// Mid game scenario: 4 players, 6 rounds, scores ranging 60-150
const players = [
  { id: uid(), name: "Alice" },
  { id: uid(), name: "Bob" },
  { id: uid(), name: "Charlie" },
  { id: uid(), name: "Dana" },
];

const rounds = [
  // Round 1 — moderate scores
  {
    roundNumber: 1,
    playerResults: {
      [players[0].id]: makePlayerResult([3, 5, 8], ["+4"]),       // 16 + 4 = 20
      [players[1].id]: makePlayerResult([2, 7, 10]),               // 19
      [players[2].id]: makePlayerResult([1, 4, 6, 9]),             // 20
      [players[3].id]: makePlayerResult([0, 11]),                   // 11
    },
  },
  // Round 2 — Bob busts, Alice gets a good round
  {
    roundNumber: 2,
    playerResults: {
      [players[0].id]: makePlayerResult([4, 7, 11], ["×2"]),      // (22)*2 = 44
      [players[1].id]: makePlayerResult([3, 3], [], [], true),     // bust
      [players[2].id]: makePlayerResult([2, 5, 8]),                // 15
      [players[3].id]: makePlayerResult([6, 9, 12]),               // 27
    },
  },
  // Round 3 — Charlie catches up
  {
    roundNumber: 3,
    playerResults: {
      [players[0].id]: makePlayerResult([1, 6]),                   // 7
      [players[1].id]: makePlayerResult([4, 8, 12], ["+6"]),       // 24 + 6 = 30
      [players[2].id]: makePlayerResult([3, 7, 10, 11], ["+2"]),   // 31 + 2 = 33
      [players[3].id]: makePlayerResult([0, 5, 9]),                // 14
    },
  },
  // Round 4 — Dana gets a strong round with modifier
  {
    roundNumber: 4,
    playerResults: {
      [players[0].id]: makePlayerResult([2, 9]),                   // 11
      [players[1].id]: makePlayerResult([1, 5, 7]),                // 13
      [players[2].id]: makePlayerResult([6, 6], [], [], true),     // bust
      [players[3].id]: makePlayerResult([3, 8, 10, 12], ["×2"]),   // (33)*2 = 66
    },
  },
  // Round 5 — mixed results, an action card appears
  {
    roundNumber: 5,
    playerResults: {
      [players[0].id]: makePlayerResult([0, 3, 7, 10], [], ["Freeze"]),  // 20
      [players[1].id]: makePlayerResult([2, 4, 9]),                       // 15
      [players[2].id]: makePlayerResult([1, 8, 11], ["+4"]),              // 20 + 4 = 24
      [players[3].id]: makePlayerResult([5, 12]),                          // 17
    },
  },
  // Round 6 — tight round
  {
    roundNumber: 6,
    playerResults: {
      [players[0].id]: makePlayerResult([5, 8, 12]),               // 25
      [players[1].id]: makePlayerResult([0, 3, 6, 10], ["+8"]),    // 19 + 8 = 27
      [players[2].id]: makePlayerResult([4, 9, 11]),               // 24
      [players[3].id]: makePlayerResult([1, 2, 7]),                // 10
    },
  },
];

const game = {
  id: uid(),
  players,
  rounds,
  lastReshuffle: 0,
  createdAt: Date.now(),
};

// Verify totals
console.log("=== Mid Game Mock Data ===");
console.log(`Players: ${players.map(p => p.name).join(", ")}`);
console.log(`Rounds: ${rounds.length}\n`);

for (const p of players) {
  const total = rounds.reduce((sum, r) => sum + (r.playerResults[p.id]?.score || 0), 0);
  console.log(`${p.name}: ${total} pts`);
  for (let i = 0; i < rounds.length; i++) {
    const r = rounds[i].playerResults[p.id];
    const cards = r.numberCards.join(",");
    const mods = r.modifiers.length > 0 ? ` mods:[${r.modifiers.join(",")}]` : "";
    const acts = r.actions.length > 0 ? ` acts:[${r.actions.join(",")}]` : "";
    console.log(`  R${i+1}: [${cards}]${mods}${acts} → ${r.busted ? "BUST" : r.score}${r.flip7 ? " (FLIP7!)" : ""}`);
  }
}

console.log("\n=== JSON Output ===");
console.log(JSON.stringify(game, null, 2));
