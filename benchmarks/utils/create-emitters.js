import EventEmitter from 'node:events';
import { createNanoEvents as createNanoEmitter } from 'nanoevents';
import EventEmitter3 from 'eventemitter3';
import { Emitter as EventtiEmitter3 } from 'eventti3';
import { Emitter as EventtiEmitter4 } from '../../dist/index.js';

export function createEmitters() {
  const eventti4 = new EventtiEmitter4();
  const eventti3 = new EventtiEmitter3();
  const ee3 = new EventEmitter3();
  const nano = createNanoEmitter();
  const node = new EventEmitter();

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

  // Don't limit the number of listeners in node.js.
  node.setMaxListeners(Infinity);

  const emitters = [eventti4, eventti3, nano, ee3, node];

  const emitterNames = new Map([
    [eventti4, 'eventti 4'],
    [eventti3, 'eventti 3'],
    [nano, 'nano'],
    [ee3, 'eventemitter3'],
    [node, 'node'],
  ]);

  function resetEmitters() {
    eventti4.off();
    eventti3.off();
    nano.events = {};
    ee3.removeAllListeners();
    node.removeAllListeners();
  }

  return {
    emitters,
    emitterNames,
    resetEmitters,
  };
}
