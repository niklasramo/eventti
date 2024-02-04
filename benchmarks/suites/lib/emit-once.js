#!/usr/bin/env node
import { createSuite } from '../../utils/create-suite.js';
import { createEmitters } from '../../utils/create-emitters.js';

// Create test suite.
export const suite = createSuite('emit-once');

// Create emitters.
const { emitters, resetEmitters } = createEmitters();

// Store counters for emit tests, used to prevent dead code elimination.
const counters = Array(100).fill(0);
let counterIndex = -1;

[1, 10, 100, 1000].forEach((listenerCount) => {
  emitters.forEach((emitter, emitterName) => {
    const eventName = `test-${listenerCount}`;
    const ci = ++counterIndex;

    for (let i = 0; i < listenerCount; ++i) {
      emitter.on(eventName, () => {
        counters[ci] += 1;
      });
    }

    suite.add(
      `${emitterName}:Add and emit once listener for an event with ${listenerCount} listeners`,
      () => {
        emitter.once(eventName, () => {
          counters[ci] += 1;
        });
        emitter.emit(eventName);
      },
    );
  });
});

suite.on('complete', resetEmitters);
