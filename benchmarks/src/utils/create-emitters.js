import EventEmitter from 'node:events';
import { createNanoEvents as createNanoEmitter } from 'nanoevents';
import mitt from 'mitt';
import { EventEmitter as TseepEmitter } from 'tseep';
import EventEmitter2 from 'eventemitter2';
import EventEmitter3 from 'eventemitter3';
import { Emitter as EventtiEmitterLatest } from 'eventti';
import { Emitter as EventtiEmitterLocal } from '../../../dist/index.js';
import { EMITTER_NAMES } from './emitter-names.js';

// Map of emitter names to emitter creation functions.
const EMITTER_MAP = new Map([
  [
    EMITTER_NAMES.EventtiLocal,
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
    EMITTER_NAMES.EventtiLatest,
    {
      create: () => {
        const eventti = new EventtiEmitterLatest();

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
    EMITTER_NAMES.Nano,
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
    EMITTER_NAMES.Mitt,
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
    EMITTER_NAMES.Tseep,
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
    EMITTER_NAMES.EventEmitter2,
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
    EMITTER_NAMES.EventEmitter3,
    {
      create: () => new EventEmitter3(),
      destroy: (emitter) => emitter.removeAllListeners(),
    },
  ],
  [
    EMITTER_NAMES.Node,
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
