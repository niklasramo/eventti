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
    group(`Add and emit once listener for an event with ${listenerCount} listeners`, () => {
      summary(() => {
        barplot(() => {
          emitters.forEach((emitter, emitterName) => {
            bench(emitterName, function* () {
              addFillEvents(emitter);

              const eventName = `test-${listenerCount}`;
              const ci = ++counterIndex;
              const benchCallback = () => {
                for (let i = 0; i < listenerCount; i++) {
                  emitter.once(eventName, () => {
                    counters[ci] += 1;
                  });
                }
                emitter.emit(eventName);
              };

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
