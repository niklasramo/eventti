#!/usr/bin/env node
import { createSuite } from '../../utils/create-suite.js';
import { createEmitters } from '../../utils/create-emitters.js';

// Create test suite.
export const suite = createSuite('mix');

// Create emitters.
const { emitters, resetEmitters } = createEmitters();

// Store counters for emit tests, used to prevent dead code elimination.
const counters = Array(100).fill(0);
let counterIndex = -1;

// This test aims to simulate a "real-world" scenario where listeners are added,
// removed and emitted. The removal is done in the middle of the listeners
// array to make it more challenging for the emitter to handle. Some emitters
// optimize for removing the last/first listener, so this will prevent that
// optimization.
[10, 100, 1000].forEach((listenerCount) => {
  emitters.forEach((emitter, emitterName) => {
    const eventName = `test-${listenerCount}`;
    const ci = ++counterIndex;

    let suiteCallback;
    switch (emitterName) {
      case 'eventti 3':
      case 'eventti 4': {
        const halfListenerCount = listenerCount / 2;
        const endIds = [];
        let nextIndex = 0;

        for (let i = 0; i < halfListenerCount; ++i) {
          emitter.on(eventName, () => (counters[ci] += 1));
        }

        for (let i = 0; i < halfListenerCount; ++i) {
          const listener = () => (counters[ci] += 1);
          endIds[i] = emitter.on(eventName, listener);
        }

        suiteCallback = () => {
          emitter.off(eventName, endIds[nextIndex]);
          const listener = () => (counters[ci] += 1);
          endIds[nextIndex] = emitter.on(eventName, listener);
          nextIndex = ++nextIndex % halfListenerCount;
          emitter.emit(eventName);
        };
        break;
      }
      case 'nano': {
        const halfListenerCount = listenerCount / 2;
        const endUnbinders = [];
        let nextIndex = 0;

        for (let i = 0; i < halfListenerCount; ++i) {
          emitter.on(eventName, () => (counters[ci] += 1));
        }

        for (let i = 0; i < halfListenerCount; ++i) {
          const listener = () => (counters[ci] += 1);
          endUnbinders[i] = emitter.on(eventName, listener);
        }

        suiteCallback = () => {
          endUnbinders[nextIndex]();
          const listener = () => (counters[ci] += 1);
          endUnbinders[nextIndex] = emitter.on(eventName, listener);
          nextIndex = ++nextIndex % halfListenerCount;
          emitter.emit(eventName);
        };
        break;
      }
      case 'mitt':
      case 'tseep':
      case 'eventemitter2':
      case 'eventemitter3':
      case 'node': {
        const halfListenerCount = listenerCount / 2;
        const endListeners = [];
        let nextIndex = 0;

        for (let i = 0; i < halfListenerCount; ++i) {
          emitter.on(eventName, () => (counters[ci] += 1));
        }

        for (let i = 0; i < halfListenerCount; ++i) {
          const listener = () => (counters[ci] += 1);
          endListeners[i] = listener;
          emitter.on(eventName, listener);
        }

        suiteCallback = () => {
          emitter.off(eventName, endListeners[nextIndex]);
          const listener = () => (counters[ci] += 1);
          emitter.on(eventName, listener);
          endListeners[nextIndex] = listener;
          nextIndex = ++nextIndex % halfListenerCount;
          emitter.emit(eventName);
        };
        break;
      }
    }

    suite.add(
      `${emitterName}:Remove the middle listener, add a new listener and emit the event for an event with ${listenerCount} listeners`,
      suiteCallback,
    );
  });
});

suite.on('complete', resetEmitters);
