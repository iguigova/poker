// The textbook ranking, independent of the grid: group the ranks, sort the
// groups by size then rank, and read the category off their shape. It ranks
// exactly five cards; a larger hand is ranked by its best five.

export const SUITS = ['D', 'H', 'C', 'S'];
export const NAMES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// A card is [rank, suit]: rank 2..14, suit one of SUITS.
export const deck = () => NAMES.flatMap((_, i) => SUITS.map(s => [i + 2, s]));

export const text = ([rank, suit]) => NAMES[rank - 2] + suit;

// [category, ...the ranks that break ties], category 0 (high card) to 8
// (straight flush).
export const rank5 = cards => {
  const count = new Map();
  for (const [r] of cards) count.set(r, (count.get(r) ?? 0) + 1);
  const groups = [...count].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const ranks = groups.map(([r]) => r);
  const shape = groups.map(([, n]) => n).join('');
  const flush = cards.every(([, s]) => s === cards[0][1]);
  const straight = shape !== '11111' ? 0
    : ranks[0] - ranks[4] === 4 ? ranks[0]
    : ranks.join() === '14,5,4,3,2' ? 5 : 0;
  const category = straight && flush ? 8 : shape === '41' ? 7 : shape === '32' ? 6
    : flush ? 5 : straight ? 4 : shape === '311' ? 3 : shape === '221' ? 2
    : shape === '2111' ? 1 : 0;
  return [category, ...(straight ? [straight] : ranks)];
};

export const compare = (a, b) => {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d !== 0) return Math.sign(d);
  }
  return 0;
};

// Every way to pick k of the indexes 0..n-1, in order.
export function* combinations(n, k, from = 0, picked = []) {
  if (picked.length === k) { yield picked; return; }
  for (let i = from; i <= n - (k - picked.length); i++) yield* combinations(n, k, i + 1, [...picked, i]);
}

export const rank = cards => {
  let best;
  for (const pick of combinations(cards.length, 5)) {
    const r = rank5(pick.map(i => cards[i]));
    if (!best || compare(r, best) > 0) best = r;
  }
  return best;
};
