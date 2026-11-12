# poker

A poker hand evaluator that turns a hand of 5 to 7 cards into one whole
number. The better hand has the higher number and equal hands have the same
one, so the winners of a showdown are the hands with the top score.
https://iguigova.github.io/poker/ deals showdowns and checks every 5-card
hand in the browser.

```js
import { hand, score, describe, winners } from './src/poker.js';

const hands = ['Joe, 3H, 4H, 5H, 6H, 8H', 'Bob, 3C, 3D, 3S, 8C, 10D'].map(hand);
winners(hands);                    // [0]: Joe
describe(score(hands[0].cards));   // { category: 5, name: 'Flush', ranks: [8, 6, 5, 4, 3] }
```

## What it does well

- **One number per hand.** A showdown is a maximum, not a sort: each hand is
  scored once, alone, and never compared with another. A score can be
  stored, sorted or sent like any integer.
- **Small and bounded.** Every hand scores a whole number from 372,197
  (7 5 4 3 2) to 6,783,750 (a royal flush), which fits in 23 bits. It is
  exact integer arithmetic, with no floating point.
- **Readable back.** The score's base-15 digits are the category and the
  ranks that decide ties, so `describe` turns any score back into the hand's
  name and its deciding cards.
- **5, 6 or 7 cards, one code path.** Five-card draw and Texas hold'em score
  the same way, by the five cards that play.
- **Fixed work.** It reads the cards once into a 4-by-13 grid, then the
  grid's 13 columns once: no sorting, no lookup table, no trying of the 21
  five-card subsets of a 7-card hand.
- **Checked on every hand.** All 2,598,960 hands of 5 cards against a
  separate textbook ranking, and all 20,358,520 of 6 and 133,784,560 of 7
  against their best five.
- **Small.** `src/poker.js` is one file with no dependencies, for Node and
  the browser.

## How it scores

A hand is a grid, a row per suit and a column per rank:

- a column's count is four, three or two of a kind;
- a row of five is a flush;
- five filled columns side by side are a straight, the ace also standing
  below the 2.

The cards are read once into the grid, and its 13 columns once from the high
end, so the five cards that play are the first ones met. The score is the category, 0 for high card to 8 for a
straight flush, followed by up to five ranks that break ties, as digits in
base 15. A rank is at most 14, so no digit carries into the next, and a
higher category always outscores a lower one.

## The code

- `src/poker.js` is the evaluator: `score`, `describe`, `winners`, and
  `card` and `hand`, which read the text form `Joe, 3H, 4H, 5H, 6H, 8H` and
  refuse a card that is not one, a hand of fewer than 5 or more than 7
  cards, and a hand that holds a card twice.
- `index.html` and `demo/` are the page. It loads `../brand.css` and
  `../brand.js` from the site root.
- `check/` judges a score. `reference.js` ranks five cards the textbook way,
  by grouping and sorting the ranks, and a larger hand by its best five;
  `order.js` holds a score to the reference on every 5-card hand; `cases.js`
  reads the original page's cases and deals seeded showdowns; `every.js`
  holds the score of every 6- or 7-card hand to the best score among its
  5-card subsets.
- `original/` is pokerIn4Hours, from `snippets_js` at `9ce578e`, as written
  in 2011 for a four-hour developer test: its source, test page, article
  and screenshot. The grid is its idea.

`npm test` checks the reference against the standard count of each category
and of the 7,462 kinds of 5-card hand, then holds the evaluator to the
reference on every 5-card hand, on 20,000 seeded showdowns of 6 cards and of
7, and on the original page's cases. `npm run every -- 6` and
`npm run every -- 7` check every 6- and 7-card hand; the 7-card run takes
about 13 minutes on 16 cores. `npm run original` runs the same checks on the
original.

## What the checks find in the original

The original scores ties with powers of ten and fails all three checks:

| Cause | Lines | Effect |
|---|---|---|
| The ace below the 2 is taken out as `14 * 10^sd`, `sd` being the run's length, 6 for A-2-3-4-5, not the ace's place, and a straight's tie-breaker is added twice. | 47, 67, 71 | A-2-3-4-5 scores -27,999,996, below every hand: 13,304 of the 27,836,991 pairs of 5-card kinds the wrong way round. |
| A tie-breaker is `rank * 10^place`, and a rank above 9 carries. | 19 | Three of a kind with Q K equals three of a kind with 2 A: 9 pairs of kinds level. Each pair needs six cards of one rank, so no one-deck showdown meets it. |
| The tie-breakers are the unpaired cards, not the five that play; two threes set no pair for a full house; any straight beside an ace and no king takes the ace correction. | 15–21, 41, 47, 65 | With 7 cards, 389 of 20,000 seeded showdowns go to the wrong hand. |
| `evalHand` upper-cases the line, the name with it. | 5 | Its page's first case names Joe and gets JOE. |

Two of its page's cases, T3 and T9, hand a player one card twice, which
`hand` refuses. Its stress test deals from `createHand`, whose `ridx`
(line 118) returns 1 to m-1, so it never deals a 2 or a diamond and can deal
one card twice.
