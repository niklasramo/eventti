#!/usr/bin/env node

import Benchmark from 'benchmark';
import { createNanoEvents as createNanoEmitter } from 'nanoevents';
import { Emitter as EventtiEmitter } from '../../../dist/index.js';
import { logResult } from '../../utils/log-result.js';

// Create test suite.
export const suite = new Benchmark.Suite('On');

// Create test emitters.
const nanoEmitter = createNanoEmitter();
const eventtiEmitter = new EventtiEmitter();
const eventtiEmitterNoDuplicates = new EventtiEmitter({ allowDuplicateListeners: false });

// Create map for getting emitter name.
const emitterNames = new Map();
emitterNames.set(eventtiEmitter, 'eventti');
emitterNames.set(eventtiEmitterNoDuplicates, 'eventti (deduped)');
emitterNames.set(nanoEmitter, 'nano');

// Store counters for emit tests, used to prevent dead code elimination.
const counters = Array(100).fill(0);
let counterIndex = -1;

// Setup emit tests.
[1, 10, 100, 1000].forEach((listenerCount) => {
  // No args.
  [eventtiEmitter, eventtiEmitterNoDuplicates, nanoEmitter].forEach((emitter) => {
    const emitterName = emitterNames.get(emitter);
    const ci = ++counterIndex;

    suite.add(`${emitterName}:Add ${listenerCount} listeners`, () => {
      for (let i = 0; i < listenerCount; ++i) {
        emitter.on(`${listenerCount}-3-args`, (a, b, c) => {
          counters[ci] += a + b + c;
        });
      }
      if (emitter === nanoEmitter) {
        emitter.events = {};
      } else {
        emitter.off(`${listenerCount}-3-args`);
      }
    });
  });
});

suite.on('cycle', logResult).on('error', (event) => {
  console.error(event.target.error.toString());
});
