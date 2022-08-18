import type { Emitter, Events } from '../Emitter';

export function emitBatch<T extends Events, S extends keyof T>(
  emitter: Emitter<T>,
  eventNames: [S, ...(keyof T)[]],
  ...args: Parameters<T[S]>
): void {
  eventNames
    .map((eventName) => {
      // @ts-ignore
      return emitter._getListeners(eventName) as EventListener[] | null;
    })
    .forEach((listeners) => {
      if (listeners) {
        let i = 0;
        let l = listeners.length;
        for (; i < l; i++) {
          // @ts-ignore
          listeners[i](...args);
        }
      }
    });
}
