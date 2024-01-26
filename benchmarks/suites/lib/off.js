#!/usr/bin/env node

import Benchmark from 'benchmark';
import { createEmitters } from '../../utils/create-emitters.js';
import { logResult } from '../../utils/log-result.js';

// Create test suite.
export const suite = new Benchmark.Suite('Off');

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

    // Add listeners.
    for (let i = 0; i < listenerCount; ++i) {
      emitter.on(eventName, () => {
        counters[ci] += 1;
      });
    }

    let suiteCallback;
    switch (emitterName) {
      case 'eventti 3':
      case 'eventti 4': {
        suiteCallback = () => {
          const listener = () => {
            counters[ci] += 1;
          };
          const id = emitter.on(eventName, listener);
          emitter.off(eventName, id);
        };
        break;
      }
      case 'nano': {
        suiteCallback = () => {
          const unbind = emitter.on(eventName, () => {
            counters[ci] += 1;
          });
          unbind();
        };
        break;
      }
      case 'eventemitter3': {
        suiteCallback = () => {
          const listener = () => {
            counters[ci] += 1;
          };
          emitter.on(eventName, listener);
          emitter.off(eventName, listener);
        };
        break;
      }
      case 'node': {
        // NOTE: node.js gets a bit of an unfair advantage here because it
        // starts looking for listeners from the end of the list and we always
        // add listeners to the end of the list, so it instantly finds the
        // correct listener to remove. To make this test more fair, we add
        // listeners to the beginning of the list for node. Granted, now it's
        // always worst case for node, which is not fair either. Ideally we
        // would add the listener to the middle of the list, but it's a bit
        // tricky to do that.
        suiteCallback = () => {
          const listener = () => {
            counters[ci] += 1;
          };
          emitter.prependListener(eventName, listener);
          emitter.off(eventName, listener);
        };
        break;
      }
    }

    // Test adding one listener and removing it.
    suite.add(
      `${emitterName}:Add and remove a listener for an event with ${listenerCount} listeners`,
      suiteCallback,
    );
  });
});

suite.on('cycle', logResult).on('error', (event) => {
  console.error(event.target.error.toString());
});

suite.on('complete', () => {
  resetEmitters();
});
