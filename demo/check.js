// A worker: holds the evaluator to the textbook ranking on every 5-card
// hand, with the same check the tests run.

import { score } from '../src/poker.js';
import { order } from '../check/order.js';

const { kinds, split, reversed, level } = order(score);
postMessage({ hands: 2598960, kinds, split: split.length, reversed: reversed.length, level: level.length });
