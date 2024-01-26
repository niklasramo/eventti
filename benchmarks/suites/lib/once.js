#!/usr/bin/env node

import Benchmark from 'benchmark';
import { createEmitters } from '../../utils/create-emitters.js';
import { logResult } from '../../utils/log-result.js';

// Create test suite.
export const suite = new Benchmark.Suite('Once');

// Create emitters.
const { emitters, emitterNames, resetEmitters } = createEmitters();

// Store counters for emit tests, used to prevent dead code elimination.
const counters = Array(100).fill(0);
let counterIndex = -1;

[1, 10, 100, 1000].forEach((listenerCount) => {
  emitters.forEach((emitter) => {
    const emitterName = emitterNames.get(emitter);
    const eventName = `test-${listenerCount}`;
    const ci = ++counterIndex;

    let suiteCallback;
    switch (emitterName) {
      case 'eventti 3':
      case 'eventti 4': {
        suiteCallback = () => {
          for (let i = 0; i < listenerCount; ++i) {
            emitter.once(eventName, () => {
              counters[ci] += 1;
            });
          }
          emitter.off(eventName);
        };
        break;
      }
      case 'nano': {
        suiteCallback = () => {
          for (let i = 0; i < listenerCount; ++i) {
            emitter.once(eventName, () => {
              counters[ci] += 1;
            });
          }
          delete emitter.events[eventName];
        };
        break;
      }
      case 'eventemitter3':
      case 'node': {
        suiteCallback = () => {
          for (let i = 0; i < listenerCount; ++i) {
            emitter.once(eventName, () => {
              counters[ci] += 1;
            });
          }
          emitter.removeAllListeners(eventName);
        };
        break;
      }
    }

    suite.add(`${emitterName}:Add ${listenerCount} once listeners`, suiteCallback);
  });
});

[1, 10, 100, 1000].forEach((listenerCount) => {
  emitters.forEach((emitter) => {
    const emitterName = emitterNames.get(emitter);
    const eventName = `test-${listenerCount}`;
    const ci = ++counterIndex;

    suite.add(`${emitterName}:Add and emit ${listenerCount} once listeners`, () => {
      for (let i = 0; i < listenerCount; ++i) {
        emitter.once(eventName, () => {
          counters[ci] += 1;
        });
      }
      emitter.emit(eventName);
    });
  });
});

suite.on('cycle', logResult).on('error', (event) => {
  console.error(event.target.error.toString());
});

suite.on('complete', () => {
  resetEmitters();
});
