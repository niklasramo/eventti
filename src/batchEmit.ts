import type { Emitter } from './Emitter';
import type { UniqueEmitter } from './UniqueEmitter';
import { Events } from './types';

export function batchEmit<T extends Events, S extends keyof T>(
  emitter: Emitter<T> | UniqueEmitter<T>,
  eventNames: [S, ...(keyof T)[]],
  ...args: Parameters<T[S]>
): void {
  const batches = [];
  let i = 0;
  let j = 0;
  let iCount = 0;
  let jCount = 0;

  // Collect batches.
  for (i = 0, iCount = eventNames.length; i < iCount; i++) {
    // @ts-ignore
    const listeners = emitter._getListeners(eventNames[i]) as EventListener[] | null;
    if (listeners) batches.push(listeners);
  }

  // Return early if we didn't find batches.
  if (!batches.length) {
    return;
  }

  // Emit batches.
  for (i = 0, iCount = batches.length; i < iCount; i++) {
    const listeners = batches[i];
    for (j = 0, jCount = listeners.length; j < jCount; j++) {
      // @ts-ignore
      listeners[j](...args);
    }
  }
}
