export type EmitterEventType = string | number | symbol;

export type EmitterEventListener = (...data: any) => any;

export type EmitterEventListenerId = string | number | symbol;

export type EmitterEvents = Record<EmitterEventType, EmitterEventListener>;

class EmitterEventData {
  idMap: Map<EmitterEventListenerId, Function>;
  fnMap: Map<Function, Set<EmitterEventListenerId>>;
  onceList: Set<EmitterEventListenerId>;

  constructor() {
    this.idMap = new Map();
    this.fnMap = new Map();
    this.onceList = new Set();
  }

  addListener(listener: Function, once?: boolean): EmitterEventListenerId {
    const listenerId = Symbol();

    let listenerIds = this.fnMap.get(listener);
    if (!listenerIds) {
      listenerIds = new Set();
      this.fnMap.set(listener, listenerIds);
    }

    listenerIds.add(listenerId);
    this.idMap.set(listenerId, listener);
    if (once) {
      this.onceList.add(listenerId);
    }

    return listenerId;
  }

  deleteListenerById(listenerId: EmitterEventListenerId) {
    if (this.idMap.has(listenerId)) {
      const listener = this.idMap.get(listenerId) as EmitterEventListener;
      const listenerIds = this.fnMap.get(
        listener
      ) as Set<EmitterEventListenerId>;
      this.onceList.delete(listenerId);
      this.idMap.delete(listenerId);
      listenerIds.delete(listenerId);
      if (!listenerIds.size) {
        this.fnMap.delete(listener);
      }
    }
  }

  deleteMatchingListeners(listener: EmitterEventListener) {
    const listenerIds = this.fnMap.get(listener);
    if (!listenerIds) return;

    for (const listenerId of listenerIds) {
      this.onceList.delete(listenerId);
      this.idMap.delete(listenerId);
    }

    this.fnMap.delete(listener);
  }

  deleteOnceListeners() {
    for (const listenerId of this.onceList) {
      this.deleteListenerById(listenerId);
    }
  }
}

export class Emitter<Events extends EmitterEvents> {
  protected _events: Map<EmitterEventType, EmitterEventData>;
  protected _once: boolean;

  constructor() {
    this._events = new Map();
    this._once = false;
  }

  on<EventType extends keyof Events>(
    type: EventType,
    listener: Events[EventType]
  ): EmitterEventListenerId {
    const { _once } = this;
    this._once = false;

    let eventData = this._events.get(type);
    if (eventData) {
      return eventData.addListener(listener, _once);
    }

    eventData = new EmitterEventData();
    const listenerId = eventData.addListener(listener, _once);
    this._events.set(type, eventData);
    return listenerId;
  }

  once<EventType extends keyof Events>(
    type: EventType,
    listener: Events[EventType]
  ): EmitterEventListenerId {
    this._once = true;
    return this.on(type, listener);
  }

  off<EventType extends keyof Events>(
    type?: EventType,
    listener?: Events[EventType] | EmitterEventListenerId
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
    if (typeof listener === "function") {
      eventData.deleteMatchingListeners(listener);
    }
    // If the listener is a listener id let's delete the specific listener.
    else {
      eventData.deleteListenerById(listener);
    }

    // If the event type doesn't have any listeners left let's delete it.
    if (!eventData.idMap.size) {
      this._events.delete(type);
    }
  }

  emit<EventType extends keyof Events>(
    type: EventType,
    ...args: Parameters<Events[EventType]>
  ): void {
    const eventData = this._events.get(type);
    if (!eventData) return;

    // We need to clone the listeners in order to guarantee the execution of
    // all the listeners that exist currently. If we didn't do this then
    // adding/removing listeners within the listener callbacks would affect
    // the processing of the listeners.
    const listeners = [...eventData.idMap.values()];

    // Delete all once listeners _after_ the clone operation. It's important
    // we do this before executing the listeners, otherwise the once listeners
    // can be called multiple times before they are removed.
    eventData.deleteOnceListeners();

    // Execute all event listeners.
    let i = 0;
    let l = listeners.length;
    for (; i < l; i++) {
      listeners[i](...(args as any[]));
    }
  }
}
