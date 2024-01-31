#!/usr/bin/env node
import { createSuite } from '../../utils/create-suite.js';
import { createEmitters } from '../../utils/create-emitters.js';

// Create test suite.
export const suite = createSuite('Emit');

// Create emitters.
const { emitters, resetEmitters } = createEmitters();

// Store counters for emit tests, used to prevent dead code elimination.
const counters = Array(100).fill(0);
let counterIndex = -1;

[1, 11, 101, 1001].forEach((listenerCount) => {
  emitters.forEach((emitter, emitterName) => {
    const eventName = `${listenerCount}-no-args`;
    const ci = ++counterIndex;

    for (let i = 0; i < listenerCount; ++i) {
      emitter.on(eventName, () => {
        counters[ci] += 1;
      });
    }

    emitter.emit(eventName);

    suite.add(`${emitterName}:Emit ${listenerCount} listeners without args`, () => {
      emitter.emit(eventName);
    });
  });
});

[1, 11, 101, 1001].forEach((listenerCount) => {
  emitters.forEach((emitter, emitterName) => {
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

suite.on('complete', resetEmitters);
