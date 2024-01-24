#!/usr/bin/env node

import Benchmark from 'benchmark';
import { createNanoEvents as createNanoEmitter } from 'nanoevents';
import { Emitter as EventtiEmitter } from '../../../dist/index.js';
import { logResult } from '../../utils/log-result.js';

// Create test suite.
export const suite = new Benchmark.Suite('Once');

// Create test emitters.
const nanoEmitter = createNanoEmitter();
const eventtiEmitter = new EventtiEmitter();

// Add once method to nanoevents emitter (as instructed in nanoevents README).
nanoEmitter.once = (event, callback) => {
  const unbind = nanoEmitter.on(event, (...args) => {
    unbind();
    callback(...args);
  });
  return unbind;
};

// Create map for getting emitter name.
const emitterNames = new Map();
emitterNames.set(eventtiEmitter, 'eventti');
emitterNames.set(nanoEmitter, 'nano');

// Store counters for emit tests, used to prevent dead code elimination.
const counters = Array(100).fill(0);
let counterIndex = -1;

// Setup tests.
[1, 10, 100, 1000].forEach((listenerCount) => {
  [eventtiEmitter, nanoEmitter].forEach((emitter) => {
    const emitterName = emitterNames.get(emitter);
    const ci = ++counterIndex;

    suite.add(`${emitterName}:Add ${listenerCount} once listeners`, () => {
      for (let i = 0; i < listenerCount; ++i) {
        emitter.once(`test-1-${listenerCount}`, () => {
          counters[ci] += 1;
        });
      }
      if (emitter === nanoEmitter) {
        emitter.events = {};
      } else {
        emitter.off(`test-1-${listenerCount}`);
      }
    });
  });

  [eventtiEmitter, nanoEmitter].forEach((emitter) => {
    const emitterName = emitterNames.get(emitter);
    const ci = ++counterIndex;

    suite.add(`${emitterName}:Add and emit ${listenerCount} once listeners`, () => {
      for (let i = 0; i < listenerCount; ++i) {
        emitter.once(`test-2-${listenerCount}`, () => {
          counters[ci] += 1;
        });
      }
      emitter.emit(`test-2-${listenerCount}`);
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
