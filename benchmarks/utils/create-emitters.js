import EventEmitter from 'node:events';
import { createNanoEvents as createNanoEmitter } from 'nanoevents';
import { EventEmitter as TseepEmitter } from 'tseep';
import EventEmitter2 from 'eventemitter2';
import EventEmitter3 from 'eventemitter3';
import { Emitter as EventtiEmitter3 } from 'eventti3';
import { Emitter as EventtiEmitter4 } from '../../dist/index.js';

// Map of emitter names to emitter creation functions.
const EMITTER_MAP = new Map([
  [
    'eventti 4',
    {
      create: () => {
        const eventti = new EventtiEmitter4();

        // By default eventti4 creates a new symbol as the listener id, but that is
        // quite a bit slower than just incrementing a number. Using a symbol as the
        // listener id is the safest option as there is no chance of a collision, but
        // using a number is also fine as long as the user doesn't use a number value
        // manually as the listener id.
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
    'eventti 3',
    {
      create: () => new EventtiEmitter3(),
      destroy: (emitter) => emitter.off(),
    },
  ],
  [
    'nano',
    {
      create: () => {
        const nano = createNanoEmitter();

        // Add once method to nanoevents emitter (as instructed in nanoevents README).
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
