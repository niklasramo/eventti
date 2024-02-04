#!/usr/bin/env node
import { createSuite } from '../../utils/create-suite.js';
import { createEmitters } from '../../utils/create-emitters.js';

// Create test suite.
export const suite = createSuite('on');

// Create emitters.
const { emitters, resetEmitters } = createEmitters();

// Store counters for emit tests, used to prevent dead code elimination.
const counters = Array(100).fill(0);
let counterIndex = -1;

[1, 10, 100, 1000].forEach((listenerCount) => {
  emitters.forEach((emitter, emitterName) => {
    const eventName = `test-${listenerCount}`;
    const ci = ++counterIndex;

    let suiteCallback;
    switch (emitterName) {
      case 'eventti 3':
      case 'eventti 4':
      case 'mitt': {
        suiteCallback = () => {
          for (let i = 0; i < listenerCount; ++i) {
            emitter.on(eventName, () => {
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
            emitter.on(eventName, () => {
              counters[ci] += 1;
            });
          }
          delete emitter.events[eventName];
        };
        break;
      }
      case 'tseep':
      case 'eventemitter2':
      case 'eventemitter3':
      case 'node': {
        suiteCallback = () => {
          for (let i = 0; i < listenerCount; ++i) {
            emitter.on(eventName, () => {
              counters[ci] += 1;
            });
          }
          emitter.removeAllListeners(eventName);
        };
        break;
      }
    }

    suite.add(`${emitterName}:Add ${listenerCount} listeners`, suiteCallback);
  });
});

suite.on('complete', resetEmitters);
