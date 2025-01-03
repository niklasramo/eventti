export type EventName = string | number | symbol;

export type EventListener = (...data: any) => any;

export type EventListenerId = null | string | number | symbol | bigint | Function | Object;

export type Events = Record<EventName, EventListener>;

export const EmitterDedupe = {
  ADD: 'add',
  UPDATE: 'update',
  IGNORE: 'ignore',
  THROW: 'throw',
} as const;

export type EmitterDedupe = (typeof EmitterDedupe)[keyof typeof EmitterDedupe];

export type EmitterOptions = {
  dedupe?: EmitterDedupe;
  getId?: (listener: EventListener) => EventListenerId;
};

export class Emitter<T extends Events> {
  dedupe: EmitterDedupe;
  getId: (listener: EventListener) => EventListenerId;
  protected _events: Map<
    EventName,
    { m: Map<EventListenerId, EventListener>; l: EventListener[] | null }
  >;

  constructor(options: EmitterOptions = {}) {
    this.dedupe = options.dedupe || EmitterDedupe.ADD;
    this.getId = options.getId || (() => Symbol());
    this._events = new Map();
  }

  protected _getListeners<EventName extends keyof T>(eventName: EventName): EventListener[] | null {
    // Get the listeners for emit process. We could do just a simple
    // [...idMap.values()] and be done with it, but then we'd be cloning the
    // listeners always which adds a noticeable performance hit. So what we
    // want to do instead is to cache the emit list and only invalidate it when
    // listeners are removed.
    const eventData = this._events.get(eventName);
    if (eventData) {
      const idMap = eventData.m;
      if (idMap.size) {
        return (eventData.l = eventData.l || [...idMap.values()]);
      }
    }
    return null;
  }

  on<EventName extends keyof T>(
    eventName: EventName,
    listener: T[EventName],
    listenerId?: EventListenerId,
  ): EventListenerId {
    // Get or create the event data.
    const events = this._events;
    let eventData = events.get(eventName);
    if (!eventData) {
      eventData = { m: new Map(), l: null };
      events.set(eventName, eventData);
    }

    // Get the id map.
    const idMap = eventData.m;

    // Create listener id if not provided.
    listenerId = listenerId === undefined ? this.getId(listener) : listenerId;

    // Handle duplicate ids.
    if (idMap.has(listenerId)) {
      switch (this.dedupe) {
        case EmitterDedupe.THROW: {
          throw new Error('Eventti: duplicate listener id!');
        }
        case EmitterDedupe.IGNORE: {
          return listenerId;
        }
        case EmitterDedupe.UPDATE: {
          eventData.l = null;
          break;
        }
        default: {
          idMap.delete(listenerId);
          eventData.l = null;
        }
      }
    }

    // Store listener to id map.
    idMap.set(listenerId, listener);

    // Add to emit list if needed. We can safely add new listeners to the
    // end of emit list even if it is currently emitting, but we can't remove
    // items from it while it is emitting.
    eventData.l?.push(listener);

    return listenerId;
  }

  once<EventName extends keyof T>(
    eventName: EventName,
    listener: T[EventName],
    listenerId?: EventListenerId,
  ): EventListenerId {
    let isCalled = false;
    listenerId = listenerId === undefined ? this.getId(listener) : listenerId;
    return this.on(
      eventName,
      ((...args) => {
        if (!isCalled) {
          isCalled = true;
          this.off(eventName, listenerId);
          listener(...args);
        }
      }) as T[EventName],
      listenerId,
    );
  }

  off<EventName extends keyof T>(eventName?: EventName, listenerId?: EventListenerId): void {
    // If event name is not provided, let's remove all listeners from the
    // emitter.
    if (eventName === undefined) {
      this._events.clear();
      return;
    }

    // If listener id is not provided, let's remove all listeners from the
    // event.
    if (listenerId === undefined) {
      this._events.delete(eventName);
      return;
    }

    // Get the event data.
    const eventData = this._events.get(eventName);
    if (!eventData) return;

    // Remove the listener from the event.
    if (eventData.m.delete(listenerId)) {
      // Invalidate the emit list.
      eventData.l = null;

      // If the event doesn't have any listeners left we can remove it from
      // the emitter (to prevent memory leaks).
      if (!eventData.m.size) {
        this._events.delete(eventName);
      }
    }
  }

  emit<EventName extends keyof T>(eventName: EventName, ...args: Parameters<T[EventName]>): void {
    const listeners = this._getListeners(eventName);
    if (listeners) {
      const len = listeners.length;
      let i = 0;
      if (args.length) {
        for (; i < len; i++) {
          listeners[i](...args);
        }
      } else {
        for (; i < len; i++) {
          listeners[i]();
        }
      }
    }
  }

  listenerCount<EventName extends keyof T>(eventName?: EventName): number {
    if (eventName === undefined) {
      let count = 0;
      this._events.forEach((value) => {
        count += value.m.size;
      });
      return count;
    }
    return this._events.get(eventName)?.m.size || 0;
  }
}
