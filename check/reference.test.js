// The reference against the counts every poker text gives for the 2,598,960
// five-card hands, and on hands whose order is known.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compare, rank, rank5 } from './reference.js';
import { everyHand } from './order.js';

const cards = line => line.split(' ').map(c => [{ J: 11, Q: 12, K: 13, A: 14 }[c.slice(0, -1)] ?? Number(c.slice(0, -1)), c.slice(-1)]);

test('counts each category and kind of 5-card hand as the standard tables do', () => {
  const perCategory = new Array(9).fill(0);
  const kinds = new Set();
  for (const hand of everyHand()) {
    const r = rank5(hand);
    perCategory[r[0]]++;
    kinds.add(r.join());
  }
  assert.deepEqual(perCategory, [1302540, 1098240, 123552, 54912, 10200, 5108, 3744, 624, 40]);
  assert.equal(kinds.size, 7462);
});

test('ranks the wheel as the lowest straight', () => {
  assert.deepEqual(rank5(cards('AD 2H 3C 4S 5D')), [4, 5]);
  assert.equal(compare(rank5(cards('2D 3H 4C 5S 6D')), rank5(cards('AD 2H 3C 4S 5D'))), 1);
});

test('ranks seven cards by their best five', () => {
  assert.deepEqual(rank(cards('9S 9C 9H 5D 5C 5H KS')), [6, 9, 5]);
  assert.deepEqual(rank(cards('2H 3H 4H 5H 9H AD KH')), [5, 13, 9, 5, 4, 3]);
});
