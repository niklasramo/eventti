#!/usr/bin/env node
import { bench, run, group, summary, barplot, do_not_optimize } from 'mitata';
import { createEmitters } from '../utils/create-emitters.js';
import { addFillEvents } from '../utils/add-fill-events.js';

export default async function () {
  // Create emitters.
  const { emitters, resetEmitters } = createEmitters();

  // Store counters for emit tests, used to prevent dead code elimination.
  const counters = Array(100).fill(0);
  let counterIndex = -1;

  for (const listenerCount of [1, 10, 100, 1000]) {
    group(`Emit ${listenerCount} listeners with 5 args`, () => {
      summary(() => {
        barplot(() => {
          emitters.forEach((emitter, emitterName) => {
            bench(emitterName, function* () {
              addFillEvents(emitter);

              const eventName = `test-${listenerCount}`;
              const ci = ++counterIndex;
              const benchCallback =
                emitterName === 'mitt'
                  ? () => emitter.emit(eventName, [1, 2, 3, 4, 5])
                  : () => emitter.emit(eventName, 1, 2, 3, 4, 5);

              // Add listeners.
              if (emitterName === 'mitt') {
                for (let i = 0; i < listenerCount; i++) {
                  emitter.on(eventName, ([a, b, c, d, e]) => {
                    counters[ci] += a + b + c + d + e;
                  });
                }
              } else {
                for (let i = 0; i < listenerCount; i++) {
                  emitter.on(eventName, (a, b, c, d, e) => {
                    counters[ci] += a + b + c + d + e;
                  });
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
