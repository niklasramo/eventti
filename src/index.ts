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
    { idMap: Map<EventListenerId, EventListener>; emitList: EventListener[] | null }
  >;

  constructor(options: EmitterOptions = {}) {
    const { dedupe = EmitterDedupe.ADD, getId = () => Symbol() } = options;
    this.dedupe = dedupe;
    this.getId = getId;
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
    // Get or create the event data.
    const { _events } = this;
    let eventData = _events.get(eventName);
    if (!eventData) {
      eventData = { idMap: new Map(), emitList: null };
      _events.set(eventName, eventData);
    }

    // Get the id map and emit list.
    const { idMap, emitList } = eventData;

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
          eventData.emitList = null;
          break;
        }
        default: {
          idMap.delete(listenerId);
          eventData.emitList = null;
        }
      }
    }

    // Store listener to id map.
    idMap.set(listenerId, listener);

    // Add to emit list if needed. We can safely add new listeners to the
    // end of emit list even if it is currently emitting, but we can't remove
    // items from it while it is emitting.
    emitList?.push(listener);

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
      // @ts-ignore
      (...args: any[]) => {
        if (!isCalled) {
          isCalled = true;
          this.off(eventName, listenerId);
          listener(...args);
        }
      },
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
    if (eventData.idMap.delete(listenerId)) {
      // Invalidate the emit list.
      eventData.emitList = null;

      // If the event doesn't have any listeners left we can remove it from
      // the emitter (to prevent memory leaks).
      if (!eventData.idMap.size) {
        this._events.delete(eventName);
      }
    }
  }

  emit<EventName extends keyof T>(eventName: EventName, ...args: Parameters<T[EventName]>): void {
    const listeners = this._getListeners(eventName);
    if (!listeners) return;

    // Here we optimize the emit process by avoiding the spread operator when
    // there are no arguments. This is a micro optimization, but it does make
    // a difference. Also, avoid the for loop when there is only one listener.
    const { length } = listeners;
    if (args.length) {
      if (length === 1) {
        listeners[0](...(args as any[]));
      } else {
        let i = 0;
        for (; i < length; i++) {
          listeners[i](...(args as any[]));
        }
      }
    } else {
      if (length === 1) {
        listeners[0]();
      } else {
        let i = 0;
        for (; i < length; i++) {
          listeners[i]();
        }
      }
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
