// Every hand of 6 or 7 cards: its score must equal the best score among its
// 5-card subsets, which the tests check against the reference on every
// 5-card hand. `npm run every -- 7` takes about 13 minutes on 16 cores.

import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { availableParallelism } from 'node:os';
import { score } from '../src/poker.js';
import { combinations, deck, text } from './reference.js';

const size = Number(process.argv[2] ?? workerData?.size ?? 7);
const cards = deck();

// Each 5-card subset, named by the one or two places it leaves out.
const omitted = [...combinations(size, size - 5)];

// The hands whose first card is one of firsts, as index lists.
function* hands(firsts) {
  const pick = new Array(size);
  function* from(depth, start) {
    if (depth === size) { yield pick; return; }
    for (let i = start; i <= cards.length - (size - depth); i++) { pick[depth] = i; yield* from(depth + 1, i + 1); }
  }
  for (const first of firsts) { pick[0] = first; yield* from(1, first + 1); }
}

const check = firsts => {
  let total = 0;
  let wrong = 0;
  let example;
  const hand = new Array(size);
  const five = new Array(5);
  for (const pick of hands(firsts)) {
    for (let i = 0; i < size; i++) hand[i] = cards[pick[i]];
    let best = -1;
    for (const out of omitted) {
      let k = 0;
      for (let x = 0; x < size; x++) if (!out.includes(x)) five[k++] = hand[x];
      best = Math.max(best, score(five));
    }
    total++;
    if (score(hand) !== best) { wrong++; example ??= hand.map(text).join(' '); }
  }
  return { total, wrong, example };
};

if (isMainThread) {
  if (size !== 6 && size !== 7) throw new Error('npm run every -- 6, or -- 7');
  const n = availableParallelism();
  // Hands that start with a low card are the most, so deal the first cards out
  // round the workers.
  const shares = Array.from({ length: n }, (_, w) => cards.map((_, i) => i).filter(i => i % n === w));
  const results = await Promise.all(shares.map(firsts => new Promise((resolve, reject) => {
    new Worker(new URL(import.meta.url), { workerData: { size, firsts } }).on('message', resolve).on('error', reject);
  })));
  const total = results.reduce((t, r) => t + r.total, 0);
  const wrong = results.reduce((t, r) => t + r.wrong, 0);
  const example = results.find(r => r.example)?.example;
  console.log(`${total} hands of ${size} cards, ${wrong} scored apart from their best five${example ? `, such as ${example}` : ''}`);
  process.exitCode = wrong === 0 ? 0 : 1;
} else {
  parentPort.postMessage(check(workerData.firsts));
}
