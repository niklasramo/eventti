#!/usr/bin/env node

import Benchmark from 'benchmark';
import { createNanoEvents as createNanoEmitter } from 'nanoevents';
import { Emitter as EventtiEmitter } from '../../../dist/index.js';
import { logResult } from '../../utils/log-result.js';

// Create test suite.
export const suite = new Benchmark.Suite('Emit');

// Create test emitters.
const nanoEmitter = createNanoEmitter();
const eventtiEmitter = new EventtiEmitter();

// Create map for getting emitter name.
const emitterNames = new Map();
emitterNames.set(eventtiEmitter, 'eventti');
emitterNames.set(nanoEmitter, 'nano');

// Store counters for emit tests, used to prevent dead code elimination.
const counters = Array(100).fill(0);
let counterIndex = -1;

// Setup emit tests.
[1, 10, 100, 1000].forEach((listenerCount) => {
  // No args.
  [eventtiEmitter, nanoEmitter].forEach((emitter) => {
    const emitterName = emitterNames.get(emitter);
    const ci = ++counterIndex;

    for (let i = 0; i < listenerCount; ++i) {
      emitter.on(`${listenerCount}-no-args`, () => {
        counters[ci] += 1;
      });
    }

    suite.add(`${emitterName}:Emit ${listenerCount} listeners without args`, () => {
      emitter.emit(`${listenerCount}-no-args`);
    });
  });

  // 5 args.
  [eventtiEmitter, nanoEmitter].forEach((emitter) => {
    const emitterName = emitterNames.get(emitter);
    const ci = ++counterIndex;

    for (let i = 0; i < listenerCount; ++i) {
      emitter.on(`${listenerCount}-5-args`, (a, b, c, d, e) => {
        counters[ci] += a + b + c + d + e;
      });
    }

    suite.add(`${emitterName}:Emit ${listenerCount} listeners with 5 args`, () => {
      emitter.emit(`${listenerCount}-5-args`, 1, 2, 3, 4, 5);
    });
  });
});

suite.on('cycle', logResult).on('error', (event) => {
  console.error(event.target.error.toString());
});

suite.on('complete', () => {
  eventtiEmitter.off();
  nanoEmitter.events = {};
});
