// The cases both the original and the port are judged on: the original page's
// own showdowns, and seeded random showdowns whose winners the reference
// picks.

import { readFileSync } from 'node:fs';
import { compare, deck, rank } from './reference.js';

// Each <div winner="..."> of original/pokerIn4Hours.html: its id, its lines
// ("Player, card, ...") and the winners it names.
export const cases = () => {
  const html = readFileSync(new URL('../original/pokerIn4Hours.html', import.meta.url), 'utf8');
  return [...html.matchAll(/<div id="(T\d+)" class="\w+" winner="([^"]*)">([\s\S]*?)<\/div>/g)]
    .map(([, id, winners, body]) => ({
      id,
      lines: body.split('\n').map(l => l.trim()).filter(Boolean),
      winners: winners.split(',').map(w => w.trim()),
    }));
};

// A seeded generator, so a failing showdown is the same on every run.
const random = seed => () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;

// n showdowns of two hands of size cards from one shuffled deck, with the
// indexes of the hands the reference says win.
export const showdowns = (size, n, seed = 1) => {
  const next = random(seed);
  return Array.from({ length: n }, () => {
    const cards = deck();
    for (let i = 0; i < 2 * size; i++) {
      const j = i + Math.floor(next() * (cards.length - i));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    const hands = [cards.slice(0, size), cards.slice(size, 2 * size)];
    const c = compare(rank(hands[0]), rank(hands[1]));
    return { hands, winners: c > 0 ? [0] : c < 0 ? [1] : [0, 1] };
  });
};
