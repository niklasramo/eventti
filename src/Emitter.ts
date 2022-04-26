import { EventType, EventListener, EventListenerId, Events } from './types';

class EventData {
  idMap: Map<EventListenerId, EventListener>;
  fnMap: Map<Function, Set<EventListenerId>>;
  onceList: Set<EventListenerId>;
  emitList: EventListener[] | null;

  constructor() {
    this.idMap = new Map();
    this.fnMap = new Map();
    this.onceList = new Set();
    this.emitList = null;
  }

  addListener(listener: EventListener, once?: boolean): EventListenerId {
    // Create unique listener id, a symbol is optimal for this case since we
    // need uid, but not uuid.
    const listenerId = Symbol();

    // Get/Create existing listener ids for the listener.
    let listenerIds = this.fnMap.get(listener);
    if (!listenerIds) {
      listenerIds = new Set();
      this.fnMap.set(listener, listenerIds);
    }

    // Store listener and listener id.
    listenerIds.add(listenerId);
    this.idMap.set(listenerId, listener);

    // Add to once list if needed.
    if (once) {
      this.onceList.add(listenerId);
    }

    // Add to emit list if needed.
    this.emitList?.push(listener);

    return listenerId;
  }

  deleteListener(listenerId: EventListenerId) {
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

  deleteListeners(listener: EventListener) {
    const listenerIds = this.fnMap.get(listener);
    if (!listenerIds) return;

    for (const listenerId of listenerIds) {
      this.onceList.delete(listenerId);
      this.idMap.delete(listenerId);
    }

    this.fnMap.delete(listener);
    this.emitList = null;
  }
}

export class Emitter<T extends Events> {
  protected _events: Map<EventType, EventData>;

  constructor() {
    this._events = new Map();
  }

  on<EventType extends keyof T>(type: EventType, listener: T[EventType]): EventListenerId {
    // Get event data.
    let eventData = this._events.get(type);

    // Create event data if it does not exist yet.
    if (!eventData) {
      eventData = new EventData();
      this._events.set(type, eventData);
    }

    // Add the listener to the event data and return the listener id.
    return eventData.addListener(listener);
  }

  once<EventType extends keyof T>(type: EventType, listener: T[EventType]): EventListenerId {
    // Get event data.
    let eventData = this._events.get(type);

    // Create event data if it does not exist yet.
    if (!eventData) {
      eventData = new EventData();
      this._events.set(type, eventData);
    }

    // Add the listener to the event (with once flag) data and return the
    // listener id.
    return eventData.addListener(listener, true);
  }

  off<EventType extends keyof T>(
    type?: EventType,
    listener?: T[EventType] | EventListenerId
  ): void {
    // If type is undefined, let's remove all listeners from the emitter.
    if (type === undefined) {
      this._events.clear();
      return;
    }

    // If listener is undefined, let's remove all listeners from the type.
    if (listener === undefined) {
      this._events.delete(type);
      return;
    }

    // Let's get the event data for the listener.
    const eventData = this._events.get(type);
    if (!eventData) return;

    // If listener is a function let's delete all instances of it from the
    // event type.
    if (typeof listener === 'function') {
      eventData.deleteListeners(listener);
    }
    // If the listener is a listener id let's delete the specific listener.
    else {
      eventData.deleteListener(listener);
    }

    // If the event type doesn't have any listeners left let's delete it.
    if (!eventData.idMap.size) {
      this._events.delete(type);
    }
  }

  emit<EventType extends keyof T>(type: EventType, ...args: Parameters<T[EventType]>): void {
    const eventData = this._events.get(type);
    if (!eventData || !eventData.idMap.size) return;

    // Get the listeners for this emit process. If we have cached listeners
    // in event data (emit list) we use that, and fallback to cloning the
    // listeners from the id map. The listeners we loop should be just a
    // simple array for best performance. Cloning the listeners is expensive,
    // which is why we do it only when absolutely needed.
    const listeners = eventData.emitList || [...eventData.idMap.values()];

    // Cache the listeners.
    eventData.emitList = listeners;

    // Delete all once listeners _after_ the clone operation. We don't want
    // to touch the cloned/cached listeners here, but only the "live" data.
    // Note the listeners will be uncached from event data via
    // "eventData.deleteListener" method in case there are once listeners,
    // intentionally.
    if (eventData.onceList.size) {
      for (const listenerId of eventData.onceList) {
        eventData.deleteListener(listenerId);
      }
    }

    // Execute the current event listeners. Basic for loop for the win. Here
    // it is important to cache the listeners' length for functionality's sake
    // as the listeners array may grow during execution (but not shrink).
    let i = 0;
    let l = listeners.length;
    for (; i < l; i++) {
      listeners[i](...(args as any[]));
    }
  }
}
