// Judges a scoring function on every 5-card hand against the reference: each
// kind of hand the reference tells apart must have one score, and the scores
// must rise as the reference's ranking does.

import { combinations, compare, deck, rank5 } from './reference.js';

export const everyHand = function* (size = 5) {
  const cards = deck();
  for (const pick of combinations(cards.length, size)) yield pick.map(i => cards[i]);
};

// score: cards -> number. Returns the kinds of hand, the kinds given more
// than one score, and the pairs of kinds scored the wrong way round or level.
export const order = score => {
  const kinds = new Map();
  for (const hand of everyHand()) {
    const key = rank5(hand);
    const id = key.join();
    const s = score(hand);
    const kind = kinds.get(id) ?? { key, min: s, max: s, hand };
    kind.min = Math.min(kind.min, s);
    kind.max = Math.max(kind.max, s);
    kinds.set(id, kind);
  }
  const sorted = [...kinds.values()].sort((a, b) => compare(a.key, b.key));
  const split = sorted.filter(k => k.min !== k.max);
  const reversed = [];
  const level = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      if (sorted[i].max > sorted[j].min) reversed.push([sorted[i], sorted[j]]);
      else if (sorted[i].max === sorted[j].min) level.push([sorted[i], sorted[j]]);
    }
  }
  return { kinds: sorted.length, split, reversed, level };
};
