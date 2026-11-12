// The checks, run on the original: `npm run original`. It loads
// original/pokerIn4Hours.js as the browser did and scores each hand through
// evalHand, which reads a line of the form "Player, card, card, ...".

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { order } from './order.js';
import { showdowns, cases } from './cases.js';
import { text } from './reference.js';

const context = createContext({});
runInContext(readFileSync(new URL('../original/pokerIn4Hours.js', import.meta.url), 'utf8'), context);
const score = cards => context.evalHand('P, ' + cards.map(text).join(', ')).score;

const show = (relation, [a, b]) =>
  `${a.hand.map(text).join(' ')} (${a.max}) ${relation} ${b.hand.map(text).join(' ')} (${b.min})`;

test('orders every 5-card hand as the reference does', () => {
  const { kinds, split, reversed, level } = order(score);
  assert.deepEqual(
    { kinds, split: split.length, reversed: reversed.length, level: level.length },
    { kinds: 7462, split: 0, reversed: 0, level: 0 },
    [...reversed.slice(0, 1).map(p => show('above', p)), ...level.slice(0, 1).map(p => show('level with', p))].join('; '),
  );
});

test('picks the winners of 7-card showdowns', () => {
  const wrong = showdowns(7, 20000).filter(({ hands, winners }) => {
    const scores = hands.map(score);
    const top = Math.max(...scores);
    return scores.flatMap((s, i) => (s === top ? [i] : [])).join() !== winners.join();
  });
  assert.equal(wrong.length, 0, `${wrong.length} of 20000 showdowns won by the wrong hand`);
});

test("picks the winners of its own page's cases, named as written", () => {
  const got = cases().map(({ id, lines }) => {
    const hands = lines.map(line => context.evalHand(line));
    const top = Math.max(...hands.map(h => h.score));
    return [id, hands.filter(h => h.score === top).map(h => h.player)];
  });
  assert.deepEqual(got, cases().map(({ id, winners }) => [id, winners]));
});
