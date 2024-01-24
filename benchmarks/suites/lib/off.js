#!/usr/bin/env node

import Benchmark from 'benchmark';
import { createNanoEvents as createNanoEmitter } from 'nanoevents';
import { Emitter as EventtiEmitter } from '../../../dist/index.js';
import { logResult } from '../../utils/log-result.js';

// Create test suite.
export const suite = new Benchmark.Suite('Off');

// Create test emitters.
const nanoEmitter = createNanoEmitter();
const eventtiEmitter1 = new EventtiEmitter();
const eventtiEmitter2 = new EventtiEmitter();

// Create map for getting emitter name.
const emitterNames = new Map();
emitterNames.set(eventtiEmitter1, 'eventti (id)');
emitterNames.set(eventtiEmitter2, 'eventti (cb)');
emitterNames.set(nanoEmitter, 'nano');

// Store counters for emit tests, used to prevent dead code elimination.
const counters = Array(100).fill(0);
let counterIndex = -1;

// Setup tests.
[1, 10, 100, 1000].forEach((listenerCount) => {
  // No args.
  [eventtiEmitter1, eventtiEmitter2, nanoEmitter].forEach((emitter) => {
    const emitterName = emitterNames.get(emitter);
    const ci = ++counterIndex;

    // Add listeners.
    for (let i = 0; i < listenerCount; ++i) {
      emitter.on(`test-${listenerCount}`, () => {
        counters[ci] += 1;
      });
    }

    // Test adding one listener and removing it.
    suite.add(
      `${emitterName}:Add and remove a listener for an event with ${listenerCount} listeners`,
      emitterName === 'eventti (id)'
        ? () => {
            const id = emitter.on(`test-${listenerCount}`, () => {
              counters[ci] += 1;
            });
            emitter.off(`test-${listenerCount}`, id);
          }
        : emitterName === 'eventti (cb)'
          ? () => {
              const callback = () => (counters[ci] += 1);
              emitter.on(`test-${listenerCount}`, callback);
              emitter.off(`test-${listenerCount}`, callback);
            }
          : () => {
              const unbind = emitter.on(`test-${listenerCount}`, () => {
                counters[ci] += 1;
              });
              unbind();
            },
    );
  });
});

suite.on('cycle', logResult).on('error', (event) => {
  console.error(event.target.error.toString());
});

suite.on('complete', () => {
  eventtiEmitter1.off();
  eventtiEmitter2.off();
  nanoEmitter.events = {};
});
