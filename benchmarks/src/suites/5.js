#!/usr/bin/env node
import { bench, run, group, summary, barplot, do_not_optimize } from 'mitata';
import { createEmitters } from '../utils/create-emitters.js';
import { addFillEvents } from '../utils/add-fill-events.js';

export default async function () {
  // Create emitters.
  const { emitters, resetEmitters } = createEmitters();

  // Store counters for emit tests
  const counters = Array(100).fill(0);
  let counterIndex = -1;

  for (const listenerCount of [10, 100, 1000]) {
    group(
      `Remove the middle listener and add a new listener for an event with ${listenerCount} listeners`,
      () => {
        summary(() => {
          barplot(() => {
            emitters.forEach((emitter, emitterName) => {
              bench(emitterName, function* () {
                addFillEvents(emitter);

                const eventName = `test-${listenerCount}`;
                const ci = ++counterIndex;
                const halfListenerCount = listenerCount / 2;

                let nextIndex = 0;
                let benchCallback;

                for (let i = 0; i < halfListenerCount; i++) {
                  emitter.on(eventName, () => (counters[ci] += 1));
                }

                switch (emitterName) {
                  case 'eventti local':
                  case 'eventti': {
                    const endIds = [];

                    for (let i = 0; i < halfListenerCount; i++) {
                      const listener = () => (counters[ci] += 1);
                      endIds[i] = emitter.on(eventName, listener);
                    }

                    benchCallback = () => {
                      emitter.off(eventName, endIds[nextIndex]);
                      const listener = () => (counters[ci] += 1);
                      endIds[nextIndex] = emitter.on(eventName, listener);
                      nextIndex = ++nextIndex % halfListenerCount;
                    };
                    break;
                  }
                  case 'nano': {
                    const endUnbinders = [];

                    for (let i = 0; i < halfListenerCount; i++) {
                      const listener = () => (counters[ci] += 1);
                      endUnbinders[i] = emitter.on(eventName, listener);
                    }

                    benchCallback = () => {
                      endUnbinders[nextIndex]();
                      const listener = () => (counters[ci] += 1);
                      endUnbinders[nextIndex] = emitter.on(eventName, listener);
                      nextIndex = ++nextIndex % halfListenerCount;
                    };
                    break;
                  }
                  case 'mitt':
                  case 'tseep':
                  case 'eventemitter2':
                  case 'eventemitter3':
                  case 'node': {
                    const endListeners = [];

                    for (let i = 0; i < halfListenerCount; i++) {
                      const listener = () => (counters[ci] += 1);
                      endListeners[i] = listener;
                      emitter.on(eventName, listener);
                    }

                    benchCallback = () => {
                      emitter.off(eventName, endListeners[nextIndex]);
                      const listener = () => (counters[ci] += 1);
                      emitter.on(eventName, listener);
                      endListeners[nextIndex] = listener;
                      nextIndex = ++nextIndex % halfListenerCount;
                    };
                    break;
                  }
                }

                yield () => {
                  do_not_optimize(benchCallback());
                };
              }).gc('inner');
            });
          });
        });
      },
    );

    await run();
    console.log('');
  }

  resetEmitters();
}
