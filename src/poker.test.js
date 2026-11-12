import { test } from 'node:test';
import assert from 'node:assert/strict';
import { card, describe, hand, score, winners } from './poker.js';
import { order } from '../check/order.js';
import { cases, showdowns } from '../check/cases.js';

const cards = line => line.split(' ').map(card);

test('orders every 5-card hand as the reference does', () => {
  const { kinds, split, reversed, level } = order(score);
  assert.deepEqual(
    { kinds, split: split.length, reversed: reversed.length, level: level.length },
    { kinds: 7462, split: 0, reversed: 0, level: 0 },
  );
});

for (const size of [6, 7]) {
  test(`picks the winners of 20000 ${size}-card showdowns`, () => {
    const wrong = showdowns(size, 20000).filter(s => winners(s.hands.map(c => ({ cards: c }))).join() !== s.winners.join());
    assert.equal(wrong.length, 0);
  });
}

// Two of the original page's cases hand one player the same card twice.
const REPEATS = { T3: /A holds 2H twice/, T9: /A holds QD twice/ };

test("picks the winners of the original page's cases, named as written", () => {
  for (const { id, lines, winners: named } of cases().filter(c => !(c.id in REPEATS))) {
    const hands = lines.map(hand);
    assert.deepEqual(winners(hands).map(i => hands[i].player), named, id);
  }
});

test("refuses the original page's cases that hold a card twice", () => {
  for (const [id, error] of Object.entries(REPEATS)) {
    assert.throws(() => hand(cases().find(c => c.id === id).lines[0]), error, id);
  }
});

test('scores the wheel as the lowest straight, below 2 to 6', () => {
  assert.deepEqual(describe(score(cards('AD 2H 3C 4S 5D'))), { category: 4, name: 'Straight', ranks: [5] });
  assert.ok(score(cards('2D 3H 4C 5S 6D')) > score(cards('AD 2H 3C 4S 5D')));
  assert.ok(score(cards('AD 2H 3C 4S 5D')) > score(cards('AD AH KC QS JD')));
});

test('tells the kickers Q K from 2 A behind three of a kind', () => {
  assert.ok(score(cards('2D 3D 3H 3C AD')) > score(cards('3D 3H 3C QD KD')));
});

test('reads seven cards as the five that play', () => {
  assert.deepEqual(describe(score(cards('9S 9C 9H 5D 5C 5H KS'))).ranks, [9, 5]);
  assert.deepEqual(describe(score(cards('2H 3H 4H 5H 9H AD KH'))), { category: 5, name: 'Flush', ranks: [13, 9, 5, 4, 3] });
  assert.deepEqual(describe(score(cards('5S 6D 7H 8C 9S 9D AH'))), { category: 4, name: 'Straight', ranks: [9] });
  assert.deepEqual(describe(score(cards('KS KD 7H 7C 3S 3D 2H'))), { category: 2, name: 'Two pair', ranks: [13, 7, 3] });
});

test('reads a card in either case, and refuses one that is not a card', () => {
  assert.deepEqual(card('10h'), [10, 'H']);
  assert.deepEqual(card(' qs '), [12, 'S']);
  assert.throws(() => card('1H'), /"1H" is not a card/);
  assert.throws(() => card('KX'), /"KX" is not a card/);
});

test('refuses a hand of fewer than 5 or more than 7 cards', () => {
  assert.throws(() => hand('Ann, 2H, 3H, 4H, 5H'), /Ann has 4 cards, not 5 to 7/);
  assert.throws(() => hand('Ann, 2H, 3H, 4H, 5H, 6H, 7H, 8H, 9H'), /Ann has 8 cards/);
});

test('scores every hand between 7 5 4 3 2 and a royal flush', () => {
  // The order check shows these are the lowest and the highest kinds.
  assert.equal(score(cards('7D 5H 4C 3S 2D')), 372197);
  assert.equal(score(cards('AS KS QS JS 10S')), 6783750);
  assert.ok(6783750 < 2 ** 23);
});
