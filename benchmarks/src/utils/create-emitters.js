import EventEmitter from 'node:events';
import { createNanoEvents as createNanoEmitter } from 'nanoevents';
import mitt from 'mitt';
import { EventEmitter as TseepEmitter } from 'tseep';
import EventEmitter2 from 'eventemitter2';
import EventEmitter3 from 'eventemitter3';
import { Emitter as EventtiEmitter } from 'eventti';
import { Emitter as EventtiEmitterLocal } from '../../../dist/index.js';

// Map of emitter names to emitter creation functions.
const EMITTER_MAP = new Map([
  [
    'eventti local',
    {
      create: () => {
        const eventti = new EventtiEmitterLocal();

        // By default eventti creates a new symbol as the listener id, but that
        // is quite a bit slower than just incrementing a number. Using a symbol
        // as the listener id is the safest option as there is no chance of a
        // collision, but using a number is also fine as long as the user
        // doesn't use a number value manually as the listener id.
        let _id = Number.MIN_SAFE_INTEGER;
        eventti.getId = () => ++_id;

        return eventti;
      },
      destroy: (emitter) => {
        emitter.off();
      },
    },
  ],
  [
    'eventti 4.0.2',
    {
      create: () => {
        const eventti = new EventtiEmitter();

        // By default eventti creates a new symbol as the listener id, but that
        // is quite a bit slower than just incrementing a number. Using a symbol
        // as the listener id is the safest option as there is no chance of a
        // collision, but using a number is also fine as long as the user
        // doesn't use a number value manually as the listener id.
        let _id = Number.MIN_SAFE_INTEGER;
        eventti.getId = () => ++_id;

        return eventti;
      },
      destroy: (emitter) => emitter.off(),
    },
  ],
  [
    'nano',
    {
      create: () => {
        const nano = createNanoEmitter();

        // Add once method as it is missing in mitt. We do it with the same
        // logic as in eventti to keep the benchmarks fair.
        nano.once = (event, callback) => {
          let isCalled = false;
          const unbind = nano.on(event, (...args) => {
            if (isCalled) return;
            isCalled = true;
            unbind();
            callback(...args);
          });
          return unbind;
        };

        return nano;
      },
      destroy: (emitter) => {
        emitter.events = {};
      },
    },
  ],
  [
    'mitt',
    {
      create: () => {
        const emitter = mitt();

        // Add once method as it is missing in mitt. We do it with the same
        // logic as in eventti to keep the benchmarks fair.
        emitter.once = (event, callback) => {
          let isCalled = false;
          const onceCallback = (data) => {
            if (isCalled) return;
            isCalled = true;
            emitter.off(event, onceCallback);
            callback(data);
          };
          return emitter.on(event, onceCallback);
        };

        return emitter;
      },
      destroy: (emitter) => {
        emitter.all.clear();
      },
    },
  ],
  [
    'tseep',
    {
      create: () => {
        const emitter = new TseepEmitter();

        // Don't limit the number of listeners.
        emitter.setMaxListeners(Number.MAX_SAFE_INTEGER);

        return emitter;
      },
      destroy: (emitter) => emitter.removeAllListeners(),
    },
  ],
  [
    'eventemitter2',
    {
      create: () => {
        const emitter = new EventEmitter2();

        // Don't limit the number of listeners.
        emitter.setMaxListeners(Number.MAX_SAFE_INTEGER);

        return emitter;
      },
      destroy: (emitter) => emitter.removeAllListeners(),
    },
  ],
  [
    'eventemitter3',
    {
      create: () => new EventEmitter3(),
      destroy: (emitter) => emitter.removeAllListeners(),
    },
  ],
  [
    'node',
    {
      create: () => {
        const emitter = new EventEmitter();

        // Don't limit the number of listeners.
        emitter.setMaxListeners(Number.MAX_SAFE_INTEGER);

        return emitter;
      },
      destroy: (emitter) => emitter.removeAllListeners(),
    },
  ],
]);

export function createEmitters() {
  const emitters = new Map();
  EMITTER_MAP.forEach((emitter, name) => {
    emitters.set(name, emitter.create());
  });

  function resetEmitters() {
    emitters.forEach((emitter, name) => {
      EMITTER_MAP.get(name).destroy(emitter);
    });
  }

  return {
    emitters,
    resetEmitters,
  };
}
