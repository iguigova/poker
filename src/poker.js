// Scores a poker hand of 5 to 7 cards so that the better hand has the higher
// score and equal hands score the same.
//
// The hand is a grid: a row per suit, a column per rank. The count down a
// column says four, three or two of a kind; a row of five or more is a
// flush; five filled columns side by side, the ace also below the 2, are a
// straight. Scoring reads the cards once into the grid, then its 13 columns
// once from the high end, so the cards that play are the first ones met. The
// score is the category, 0 for high card to 8 for a straight flush, followed
// by the ranks of the cards that decide ties, as digits in base 15: a rank is
// at most 14, so no digit carries into the next.

export const CATEGORIES = ['High card', 'One pair', 'Two pair', 'Three of a kind', 'Straight',
  'Flush', 'Full house', 'Four of a kind', 'Straight flush'];

export const SUITS = ['D', 'H', 'C', 'S'];
const SUIT_INDEX = { D: 0, H: 1, C: 2, S: 3 };
const RANK_NAMES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const DIGITS = 5;

// The rank of the highest card of a run of five in one row of the grid, a
// bit per rank, or 0. The ace, bit 14, also stands below the 2, at bit 1.
const straight = row => {
  const withLowAce = row | ((row >> 14) & 1) << 1;
  for (let r = 14; r >= 5; r--) if (((withLowAce >> (r - 4)) & 31) === 31) return r;
  return 0;
};

// The category, then up to five deciding ranks, as one base-15 number.
const value = (category, ...ranks) => {
  let v = category;
  for (let i = 0; i < DIGITS; i++) v = v * 15 + (ranks[i] ?? 0);
  return v;
};

// The highest five ranks set in a row of the grid.
const topFive = row => {
  const ranks = [];
  for (let r = 14; r >= 2 && ranks.length < 5; r--) if (row >> r & 1) ranks.push(r);
  return ranks;
};

// cards: [rank, suit] pairs, rank 2..14 (11 J, 12 Q, 13 K, 14 A), suit one of
// SUITS, all different.
export const score = cards => {
  const column = new Array(15).fill(0);
  const row = [0, 0, 0, 0];
  const length = [0, 0, 0, 0];
  for (const [r, s] of cards) {
    const i = SUIT_INDEX[s];
    column[r]++;
    row[i] |= 1 << r;
    length[i]++;
  }
  const flush = length.findIndex(n => n >= 5);
  const straightFlush = flush >= 0 ? straight(row[flush]) : 0;
  if (straightFlush) return value(8, straightFlush);

  // Each column, high to low, by its count: the ranks of fours, threes,
  // pairs and single cards.
  const quads = [];
  const trips = [];
  const pairs = [];
  const singles = [];
  for (let r = 14; r >= 2; r--) [null, singles, pairs, trips, quads][column[r]]?.push(r);

  if (quads.length) return value(7, quads[0], Math.max(trips[0] ?? 0, pairs[0] ?? 0, singles[0] ?? 0));
  if (trips.length && (trips.length > 1 || pairs.length)) {
    return value(6, trips[0], Math.max(trips[1] ?? 0, pairs[0] ?? 0));
  }
  if (flush >= 0) return value(5, ...topFive(row[flush]));
  const run = straight(row[0] | row[1] | row[2] | row[3]);
  if (run) return value(4, run);
  if (trips.length) return value(3, trips[0], ...singles.slice(0, 2));
  if (pairs.length > 1) return value(2, pairs[0], pairs[1], Math.max(pairs[2] ?? 0, singles[0] ?? 0));
  if (pairs.length) return value(1, pairs[0], ...singles.slice(0, 3));
  return value(0, ...singles.slice(0, 5));
};

// The score read back: its category and the ranks that decided it.
export const describe = s => {
  const digits = [];
  for (let i = 0; i <= DIGITS; i++, s = Math.floor(s / 15)) digits.unshift(s % 15);
  const [category, ...ranks] = digits;
  return { category, name: CATEGORIES[category], ranks: ranks.filter(r => r > 0) };
};

export const rankName = r => RANK_NAMES[r - 2];

// "10H" or "qs" -> [10, 'H'], [12, 'S']; anything else throws.
export const card = word => {
  const m = /^(10|[2-9JQKA])([DHCS])$/i.exec(word.trim());
  if (!m) throw new Error(`"${word.trim()}" is not a card: a rank 2-10, J, Q, K or A, then a suit D, H, C or S`);
  const r = m[1].toUpperCase();
  return [RANK_NAMES.indexOf(r) + 2, m[2].toUpperCase()];
};

// "Joe, 3H, 4H, 5H, 6H, 8H" -> { player: 'Joe', cards: [...] }. A hand holds
// 5 to 7 different cards.
export const hand = line => {
  const [player, ...words] = line.split(',');
  const cards = words.filter(w => w.trim() !== '').map(card);
  const name = player.trim();
  if (cards.length < 5 || cards.length > 7) throw new Error(`${name} has ${cards.length} cards, not 5 to 7`);
  const ids = cards.map(([r, s]) => rankName(r) + s);
  const twice = ids.find((id, i) => ids.indexOf(id) !== i);
  if (twice) throw new Error(`${name} holds ${twice} twice`);
  return { player: name, cards };
};

// The indexes of the hands that win: every one with the top score.
export const winners = hands => {
  const scores = hands.map(h => score(h.cards));
  const top = Math.max(...scores);
  return scores.flatMap((s, i) => (s === top ? [i] : []));
};
