#!/usr/bin/env node
import { bench, run, group, summary, barplot, do_not_optimize } from 'mitata';
import { createEmitters } from '../utils/create-emitters.js';
import { addFillEvents } from '../utils/add-fill-events.js';
import { EMITTER_NAMES } from '../utils/emitter-names.js';

export default async function () {
  // Create emitters.
  const { emitters, resetEmitters } = createEmitters();

  // Store counters for emit tests
  const counters = Array(100).fill(0);
  let counterIndex = -1;

  for (const listenerCount of [1, 10, 100, 1000]) {
    group(`Add ${listenerCount} listeners, emit and remove all listeners`, () => {
      summary(() => {
        barplot(() => {
          emitters.forEach((emitter, emitterName) => {
            bench(emitterName, function* () {
              addFillEvents(emitter);

              const eventName = `test-${listenerCount}`;
              const ci = ++counterIndex;

              let benchCallback;
              switch (emitterName) {
                case EMITTER_NAMES.EventtiLocal:
                case EMITTER_NAMES.EventtiLatest:
                case EMITTER_NAMES.Mitt: {
                  benchCallback = () => {
                    for (let i = 0; i < listenerCount; i++) {
                      emitter.on(eventName, () => {
                        counters[ci] += 1;
                      });
                    }
                    emitter.emit(eventName);
                    emitter.off(eventName);
                  };
                  break;
                }
                case EMITTER_NAMES.Nano: {
                  benchCallback = () => {
                    for (let i = 0; i < listenerCount; i++) {
                      emitter.on(eventName, () => {
                        counters[ci] += 1;
                      });
                    }
                    emitter.emit(eventName);
                    delete emitter.events[eventName];
                  };
                  break;
                }
                case EMITTER_NAMES.Tseep:
                case EMITTER_NAMES.EventEmitter2:
                case EMITTER_NAMES.EventEmitter3:
                case EMITTER_NAMES.Node: {
                  benchCallback = () => {
                    for (let i = 0; i < listenerCount; i++) {
                      emitter.on(eventName, () => {
                        counters[ci] += 1;
                      });
                    }
                    emitter.emit(eventName);
                    emitter.removeAllListeners(eventName);
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
    });

    await run();
    console.log('');
  }

  resetEmitters();
}
