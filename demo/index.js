// The page's demo: scores each hand typed or dealt, names the winners, and
// shows the grid each score is read from. The check of every hand runs in
// check.js, a worker.

import { SUITS, describe, hand, rankName, score, winners } from '../src/poker.js';

const EXAMPLES = {
  joe: ['Joe, 3H, 4H, 5H, 6H, 8H', 'Bob, 3C, 3D, 3S, 8C, 10D', 'Sally, AC, 10C, 5C, 2S, 2C'],
  wheel: ['Ann, AD, 2H, 3C, 4S, 5D', 'Ben, KD, KH, KC, 9S, 2D', 'Cat, 2C, 3D, 4H, 5S, 6C'],
  threes: ['Ann, 9S, 9C, 9H, 5D, 5C, 5H, KS', 'Ben, 2H, 3H, 4H, 6H, 8H, KD, QC'],
};
const PLAYERS = ['Ann', 'Ben', 'Cat', 'Dan'];
const SYMBOL = { D: '♦', H: '♥', C: '♣', S: '♠' };
const SUIT_NAME = { D: 'diamonds', H: 'hearts', C: 'clubs', S: 'spades' };
const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

const $ = id => document.getElementById(id);
const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

const cardView = ([r, s]) => el('span', { className: `card ${s === 'D' || s === 'H' ? 'red' : ''}` }, rankName(r) + SYMBOL[s]);

// A deck shuffled with the browser's cryptographic randomness.
const shuffled = () => {
  const deck = RANKS.flatMap(r => SUITS.map(s => rankName(r) + s));
  const random = new Uint32Array(deck.length);
  crypto.getRandomValues(random);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = random[i] % (i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

const deal = holdem => {
  const deck = shuffled();
  if (!holdem) return PLAYERS.map((p, i) => [p, ...deck.slice(5 * i, 5 * i + 5)].join(', '));
  const board = deck.slice(0, 5);
  return PLAYERS.map((p, i) => [p, ...deck.slice(5 + 2 * i, 7 + 2 * i), ...board].join(', '));
};

// What the hand is, in words, from its category and the ranks that decided
// it: "three Ks, then A 9".
const plural = r => `${rankName(r)}s`;
const then = ranks => (ranks.length ? `, then ${ranks.map(rankName).join(' ')}` : '');
const PHRASES = [
  ranks => `high card ${ranks.map(rankName).join(' ')}`,
  ([p, ...rest]) => `a pair of ${plural(p)}${then(rest)}`,
  ([a, b, ...rest]) => `two pair, ${plural(a)} and ${plural(b)}${then(rest)}`,
  ([t, ...rest]) => `three ${plural(t)}${then(rest)}`,
  ([top]) => `a straight to the ${rankName(top)}`,
  ranks => `a flush, ${ranks.map(rankName).join(' ')}`,
  ([t, p]) => `a full house, ${plural(t)} over ${plural(p)}`,
  ([q, ...rest]) => `four ${plural(q)}${then(rest)}`,
  ([top]) => `a straight flush to the ${rankName(top)}`,
];
const reading = s => {
  const { category, ranks } = describe(s);
  return PHRASES[category](ranks);
};
const capital = text => text[0].toUpperCase() + text.slice(1);

// The grid the score is read from: a row per suit, a column per rank, with
// the count of each column and of each row.
const grid = cards => {
  const held = new Set(cards.map(([r, s]) => r + s));
  const column = r => cards.filter(([rank]) => rank === r).length;
  const row = s => cards.filter(([, suit]) => suit === s).length;
  return el('table', { className: 'grid' },
    el('thead', {}, el('tr', {}, el('td'), ...RANKS.map(r => el('th', { scope: 'col' }, rankName(r))), el('th', { scope: 'col' }, 'Σ'))),
    el('tbody', {},
      ...SUITS.map(s => el('tr', {},
        el('th', { scope: 'row', title: SUIT_NAME[s] }, SYMBOL[s], el('span', { className: 'sr' }, ` ${SUIT_NAME[s]}`)),
        ...RANKS.map(r => el('td', held.has(r + s) ? { className: 'held' } : {}, held.has(r + s) ? '●' : '')),
        el('td', { className: 'sum' }, String(row(s))))),
      el('tr', { className: 'sums' }, el('th', { scope: 'row' }, 'Σ'), ...RANKS.map(r => el('td', {}, column(r) ? String(column(r)) : '')), el('td'))));
};

const names = list => (list.length === 1 ? list[0] : `${list.slice(0, -1).join(', ')} and ${list.at(-1)}`);

const render = () => {
  const lines = $('lines').value.split('\n').map(l => l.trim()).filter(Boolean);
  let hands;
  try {
    hands = lines.map(hand);
  } catch (e) {
    $('summary').textContent = e.message + '.';
    $('hands').replaceChildren();
    return;
  }
  if (hands.length === 0) {
    $('summary').textContent = 'No hands yet.';
    $('hands').replaceChildren();
    return;
  }
  const won = winners(hands);
  const top = score(hands[won[0]].cards);
  $('summary').textContent = won.length === 1
    ? `${hands[won[0]].player} wins with ${reading(top)}.`
    : `${names(won.map(i => hands[i].player))} tie with ${reading(top)}.`;
  $('hands').replaceChildren(...hands.map((h, i) => {
    const s = score(h.cards);
    return el('article', { className: won.includes(i) ? 'hand won' : 'hand' },
      el('h3', {}, h.player, won.includes(i) ? el('span', { className: 'badge' }, 'wins') : ''),
      el('p', { className: 'cards' }, ...h.cards.flatMap((c, k) => (k ? [' ', cardView(c)] : [cardView(c)]))),
      el('p', {}, capital(reading(s)), '. Score ', el('code', {}, s.toLocaleString('en')), ', in base 15 ',
        el('code', {}, s.toString(15).padStart(6, '0')), '.'),
      el('div', { className: 'scroll', tabIndex: 0, role: 'region', ariaLabel: `${h.player}'s grid` }, grid(h.cards)));
  }));
};

let pending;
const later = () => { clearTimeout(pending); pending = setTimeout(render, 200); };
const show = lines => { $('lines').value = lines.join('\n'); render(); };

$('example').addEventListener('change', e => show(EXAMPLES[e.target.value]));
$('draw').addEventListener('click', () => show(deal(false)));
$('holdem').addEventListener('click', () => show(deal(true)));
$('lines').addEventListener('input', later);
$('game').addEventListener('submit', e => e.preventDefault());
show(EXAMPLES[$('example').value]);

$('check').addEventListener('click', () => {
  $('check').disabled = true;
  $('verdict').textContent = 'Checking 2,598,960 hands. This takes a few seconds.';
  const started = performance.now();
  const worker = new Worker(new URL('check.js', import.meta.url), { type: 'module' });
  worker.onmessage = ({ data }) => {
    const seconds = ((performance.now() - started) / 1000).toFixed(1);
    const { hands, kinds, split, reversed, level } = data;
    $('verdict').textContent = split + reversed + level === 0
      ? `All ${hands.toLocaleString('en')} hands pass: ${kinds.toLocaleString('en')} kinds, every hand of a kind with one score, and the scores in the textbook's order. ${seconds} s.`
      : `It fails: ${split} kinds with more than one score, ${reversed} pairs of kinds the wrong way round, ${level} pairs level. ${seconds} s.`;
    $('check').disabled = false;
    worker.terminate();
  };
  worker.onerror = e => {
    $('verdict').textContent = `The check did not run: ${e.message}`;
    $('check').disabled = false;
  };
});
