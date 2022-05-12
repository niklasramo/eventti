import type { Emitter } from '../Emitter';
import type { UniqueEmitter } from '../UniqueEmitter';
import { Events } from '../types';

export class BatchEmitter<T extends Events> {
  emitter: Emitter<T> | UniqueEmitter<T>;
  protected _batch: any[];

  constructor(emitter: Emitter<T> | UniqueEmitter<T>) {
    this.emitter = emitter;
    this._batch = [];
  }

  queue<EventName extends keyof T>(eventName: EventName, ...args: Parameters<T[EventName]>): void {
    // @ts-ignore
    const listeners = this._getListeners(eventName);
    if (listeners) this._batch.push(listeners, listeners.length, args);
  }

  emit(): void {
    const { _batch } = this;
    this._batch = [];

    let i = 0;
    let j = 0;

    for (i = 0; i < _batch.length; i += 3) {
      const listeners = _batch[i];
      const length = _batch[i + 1];
      const args = _batch[i + 2];
      for (j = 0; j < length; j++) {
        listeners[j](...args);
      }
    }
  }

  clear(): void {
    this._batch.length = 0;
  }
}
