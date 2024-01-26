#!/usr/bin/env node

import Benchmark from 'benchmark';
import { createEmitters } from '../../utils/create-emitters.js';
import { logResult } from '../../utils/log-result.js';

// Create test suite.
export const suite = new Benchmark.Suite('Emit');

// Create emitters.
const { emitters, emitterNames, resetEmitters } = createEmitters();

// Store counters for emit tests, used to prevent dead code elimination.
const counters = Array(100).fill(0);
let counterIndex = -1;

[1, 10, 100, 1000].forEach((listenerCount) => {
  emitters.forEach((emitter) => {
    const emitterName = emitterNames.get(emitter);
    const eventName = `${listenerCount}-no-args`;
    const ci = ++counterIndex;

    for (let i = 0; i < listenerCount; ++i) {
      emitter.on(eventName, () => {
        counters[ci] += 1;
      });
    }

    suite.add(`${emitterName}:Emit ${listenerCount} listeners without args`, () => {
      emitter.emit(eventName);
    });
  });
});

[1, 10, 100, 1000].forEach((listenerCount) => {
  emitters.forEach((emitter) => {
    const emitterName = emitterNames.get(emitter);
    const eventName = `${listenerCount}-5-args`;
    const ci = ++counterIndex;

    for (let i = 0; i < listenerCount; ++i) {
      emitter.on(eventName, (a, b, c, d, e) => {
        counters[ci] += a + b + c + d + e;
      });
    }

    suite.add(`${emitterName}:Emit ${listenerCount} listeners with 5 args`, () => {
      emitter.emit(eventName, 1, 2, 3, 4, 5);
    });
  });
});

suite.on('cycle', logResult).on('error', (event) => {
  console.error(event.target.error.toString());
});

suite.on('complete', () => {
  resetEmitters();
});
