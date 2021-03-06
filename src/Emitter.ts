import { EventName, EventListener, EventListenerId, Events } from './types';

function getOrCreateEventData(events: Map<EventName, EventData>, eventName: EventName) {
  let eventData = events.get(eventName);
  if (!eventData) {
    eventData = new EventData();
    events.set(eventName, eventData);
  }
  return eventData;
}

class EventData {
  idMap: Map<EventListenerId, EventListener>;
  fnMap: Map<EventListener, Set<EventListenerId>>;
  onceList: Set<EventListenerId>;
  emitList: EventListener[] | null;

  constructor() {
    this.idMap = new Map();
    this.fnMap = new Map();
    this.onceList = new Set();
    this.emitList = null;
  }

  add(listener: EventListener, once?: boolean): EventListenerId {
    // Get existing listener ids for the listener.
    let listenerIds = this.fnMap.get(listener);

    // Create listener id list if needed.
    if (!listenerIds) {
      listenerIds = new Set();
      this.fnMap.set(listener, listenerIds);
    }

    // Create unique listener id. A symbol is optimal for this case since
    // it's always unique.
    const listenerId = Symbol();

    // Store listener and listener id.
    listenerIds.add(listenerId);
    this.idMap.set(listenerId, listener);

    // Add to once list if needed.
    if (once) {
      this.onceList.add(listenerId);
    }

    // Add to emit list if needed. We can safely add new listeners to the
    // end of emit list even if it is currently looping, but we can't remove
    // items from it.
    if (this.emitList) {
      this.emitList.push(listener);
    }

    return listenerId;
  }

  delId(listenerId: EventListenerId) {
    if (!this.idMap.has(listenerId)) return;

    const listener = this.idMap.get(listenerId) as EventListener;
    const listenerIds = this.fnMap.get(listener) as Set<EventListenerId>;

    this.onceList.delete(listenerId);
    this.idMap.delete(listenerId);
    listenerIds.delete(listenerId);

    if (!listenerIds.size) {
      this.fnMap.delete(listener);
    }

    this.emitList = null;
  }

  delFn(listener: EventListener) {
    const listenerIds = this.fnMap.get(listener);
    if (!listenerIds) return;

    listenerIds.forEach((listenerId) => {
      this.onceList.delete(listenerId);
      this.idMap.delete(listenerId);
    });

    this.fnMap.delete(listener);
    this.emitList = null;
  }
}

export class Emitter<T extends Events> {
  protected _events: Map<EventName, EventData>;

  constructor() {
    this._events = new Map();
  }

  protected _getListeners<EventName extends keyof T>(eventName: EventName): EventListener[] | null {
    const eventData = this._events.get(eventName);
    if (!eventData) return null;

    const { idMap, onceList } = eventData;

    // Return early if there are no listeners.
    if (!idMap.size) return null;

    // Get the listeners for this emit process. If we have cached listeners
    // in event data (emit list) we use that, and fallback to cloning the
    // listeners from the id map. The listeners we loop should be just a
    // simple array for best performance. Cloning the listeners is expensive,
    // which is why we do it only when absolutely needed.
    const listeners = eventData.emitList || [...idMap.values()];

    // Delete all once listeners _after_ the clone operation. We don't want
    // to touch the cloned/cached listeners here, but only the "live" data.
    if (onceList.size) {
      // If once list has all the listener ids we can just delete the event
      // and be done with it.
      if (onceList.size === idMap.size) {
        this._events.delete(eventName);
      }
      // Otherwise, let's delete the once listeners one by one.
      else {
        for (const listenerId of onceList) {
          eventData.delId(listenerId);
        }
      }
    }
    // In case there are no once listeners we can cache the listeners array.
    else {
      eventData.emitList = listeners;
    }

    return listeners;
  }

  on<EventName extends keyof T>(eventName: EventName, listener: T[EventName]): EventListenerId {
    return getOrCreateEventData(this._events, eventName).add(listener);
  }

  once<EventName extends keyof T>(eventName: EventName, listener: T[EventName]): EventListenerId {
    return getOrCreateEventData(this._events, eventName).add(listener, true);
  }

  off<EventName extends keyof T>(
    eventName?: EventName,
    listener?: T[EventName] | EventListenerId
  ): void {
    // If name is undefined, let's remove all listeners from the emitter.
    if (eventName === undefined) {
      this._events.clear();
      return;
    }

    // If listener is undefined, let's remove all listeners from the name.
    if (listener === undefined) {
      this._events.delete(eventName);
      return;
    }

    // Let's get the event data for the listener.
    const eventData = this._events.get(eventName);
    if (!eventData) return;

    // If listener is a function let's delete all instances of it from the
    // event name.
    if (typeof listener === 'function') {
      eventData.delFn(listener);
    }
    // If the listener is a listener id let's delete the specific listener.
    else {
      eventData.delId(listener);
    }

    // If the event name doesn't have any listeners left let's delete it.
    if (!eventData.idMap.size) {
      this._events.delete(eventName);
    }
  }

  emit<EventName extends keyof T>(eventName: EventName, ...args: Parameters<T[EventName]>): void {
    const listeners = this._getListeners(eventName);
    if (!listeners) return;

    // Execute the current event listeners. Basic for loop for the win. Here
    // it's important to cache the listeners' length as the listeners array may
    // grow during execution (but not shrink).
    let i = 0;
    let l = listeners.length;
    for (; i < l; i++) {
      listeners[i](...(args as any[]));
    }
  }

  listenerCount<EventName extends keyof T>(eventName?: EventName): void | number {
    if (eventName === undefined) {
      let count = 0;
      this._events.forEach((_value, key) => {
        count += this.listenerCount(key) || 0;
      });
      return count;
    }
    return this._events.get(eventName)?.idMap.size;
  }
}
