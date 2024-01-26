export type EventName = string | number | symbol;

export type EventListener = (...data: any) => any;

export type EventListenerId = string | number | symbol | bigint | Function | Object;

export type Events = Record<EventName, EventListener>;

export const EmitterDedupeMode = {
  ADD: 'add',
  UPDATE: 'update',
  IGNORE: 'ignore',
  THROW: 'throw',
} as const;

export type EmitterDedupeMode = (typeof EmitterDedupeMode)[keyof typeof EmitterDedupeMode];

export type EmitterOptions = {
  dedupeMode?: EmitterDedupeMode;
  createId?: (listener: EventListener) => EventListenerId;
};

class EventData {
  idMap: Map<EventListenerId, EventListener>;
  emitList: EventListener[] | null;

  constructor() {
    this.idMap = new Map();
    this.emitList = null;
  }

  add(
    listener: EventListener,
    listenerId: EventListenerId,
    idDedupeMode: EmitterDedupeMode,
  ): EventListenerId {
    // Handle duplicate ids.
    if (this.idMap.has(listenerId)) {
      switch (idDedupeMode) {
        case EmitterDedupeMode.THROW: {
          throw new Error('Eventti: duplicate listener id!');
        }
        case EmitterDedupeMode.IGNORE: {
          return listenerId;
        }
        case EmitterDedupeMode.UPDATE: {
          this.emitList = null;
          break;
        }
        default: {
          this.del(listenerId);
        }
      }
    }

    // Store listener to id map.
    this.idMap.set(listenerId, listener);

    // Add to emit list if needed. We can safely add new listeners to the
    // end of emit list even if it is currently emitting, but we can't remove
    // items from it while it is emitting.
    this.emitList?.push(listener);

    return listenerId;
  }

  del(listenerId: EventListenerId) {
    if (this.idMap.delete(listenerId)) {
      this.emitList = null;
    }
  }
}

export class Emitter<T extends Events> {
  dedupeMode: EmitterDedupeMode;
  createId: (listener: EventListener) => EventListenerId;
  protected _events: Map<EventName, EventData>;

  constructor(options: EmitterOptions = {}) {
    const { dedupeMode = EmitterDedupeMode.ADD, createId = () => Symbol() } = options;
    this.dedupeMode = dedupeMode;
    this.createId = createId;
    this._events = new Map();
  }

  protected _getListeners<EventName extends keyof T>(eventName: EventName): EventListener[] | null {
    // Get the listeners for emit process. We could do just a simple
    // [...idMap.values()] and be done with it, but then we'd be cloning the
    // listeners always which induces a noticeable performance hit. So what we
    // want to do instead is to cache the emit list and only invalidate it when
    // listeners are removed.
    const eventData = this._events.get(eventName);
    if (eventData) {
      const { idMap } = eventData;
      if (idMap.size) {
        return (eventData.emitList = eventData.emitList || [...idMap.values()]);
      }
    }
    return null;
  }

  on<EventName extends keyof T>(
    eventName: EventName,
    listener: T[EventName],
    listenerId?: EventListenerId,
  ): EventListenerId {
    const { _events } = this;
    let eventData = _events.get(eventName);
    if (!eventData) {
      eventData = new EventData();
      _events.set(eventName, eventData);
    }
    return eventData.add(
      listener,
      listenerId === undefined ? this.createId(listener) : listenerId,
      this.dedupeMode,
    );
  }

  once<EventName extends keyof T>(
    eventName: EventName,
    listener: T[EventName],
    listenerId?: EventListenerId,
  ): EventListenerId {
    const _listenerId = listenerId === undefined ? this.createId(listener) : listenerId;
    let isCalled = false;
    return this.on(
      eventName,
      // @ts-ignore
      (...args: any[]) => {
        if (!isCalled) {
          isCalled = true;
          this.off(eventName, _listenerId);
          listener(...args);
        }
      },
      _listenerId,
    );
  }

  off<EventName extends keyof T>(eventName?: EventName, listenerId?: EventListenerId): void {
    // If name is undefined, let's remove all listeners from the emitter.
    if (eventName === undefined) {
      this._events.clear();
      return;
    }

    // If listener is undefined, let's remove all listeners of the provided
    // event name.
    if (listenerId === undefined) {
      this._events.delete(eventName);
      return;
    }

    // Get the event data.
    const eventData = this._events.get(eventName);
    if (!eventData) return;

    // Remove the listener from the event.
    eventData.del(listenerId);

    // If the event doesn't have any listeners left we can remove it from
    // the emitter (to prevent memory leaks).
    if (!eventData.idMap.size) {
      this._events.delete(eventName);
    }
  }

  emit<EventName extends keyof T>(eventName: EventName, ...args: Parameters<T[EventName]>): void {
    const listeners = this._getListeners(eventName);
    if (!listeners) return;

    // Call the current event listeners. Basic for loop for the win. Here it's
    // important to cache the listeners' length as the array may grow during
    // looping (but not shrink).
    let i = 0;
    let l = listeners.length;
    for (; i < l; i++) {
      listeners[i](...(args as any[]));
    }
  }

  listenerCount<EventName extends keyof T>(eventName?: EventName): number {
    if (eventName === undefined) {
      let count = 0;
      this._events.forEach((_value, key) => {
        count += this.listenerCount(key);
      });
      return count;
    }
    return this._events.get(eventName)?.idMap.size || 0;
  }
}
