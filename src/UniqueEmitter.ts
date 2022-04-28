import { EventType, EventListener, Events } from './types';

interface EventData {
  listeners: Set<EventListener>;
  onceListeners: Set<EventListener>;
  emitList: EventListener[] | null;
}

function getOrCreateEventData(events: Map<EventType, EventData>, type: EventType) {
  let eventData = events.get(type);
  if (!eventData) {
    eventData = {
      listeners: new Set(),
      onceListeners: new Set(),
      emitList: null,
    };
    events.set(type, eventData);
  }
  return eventData;
}

export class UniqueEmitter<T extends Events> {
  protected _events: Map<EventType, EventData>;

  constructor() {
    this._events = new Map();
  }

  on<EventType extends keyof T>(type: EventType, listener: T[EventType]): T[EventType] {
    const { listeners, emitList } = getOrCreateEventData(this._events, type);
    if (!listeners.has(listener)) {
      listeners.add(listener);
      emitList?.push(listener);
    }
    return listener;
  }

  once<EventType extends keyof T>(type: EventType, listener: T[EventType]): T[EventType] {
    const { listeners, onceListeners, emitList } = getOrCreateEventData(this._events, type);
    if (!listeners.has(listener)) {
      listeners.add(listener);
      onceListeners.add(listener);
      emitList?.push(listener);
    }
    return listener;
  }

  off<EventType extends keyof T>(type?: EventType, listener?: T[EventType]): void {
    if (type === undefined) {
      this._events.clear();
      return;
    }

    if (listener === undefined) {
      this._events.delete(type);
      return;
    }

    const eventData = this._events.get(type);
    if (!eventData) return;

    eventData.listeners.delete(listener);
    eventData.onceListeners.delete(listener);
    eventData.emitList = null;

    if (!eventData.listeners.size) {
      this._events.delete(type);
    }
  }

  emit<EventType extends keyof T>(type: EventType, data: Parameters<T[EventType]>[0]): void {
    const eventData = this._events.get(type);
    if (!eventData) return;

    const { listeners, onceListeners, emitList } = eventData;

    if (!listeners.size) return;

    const cachedListeners = emitList || [...listeners];

    if (onceListeners.size) {
      if (onceListeners.size === listeners.size) {
        this._events.delete(type);
      } else {
        for (const listener of onceListeners) {
          listeners.delete(listener);
        }
        onceListeners.clear();
        eventData.emitList = null;
      }
    } else {
      eventData.emitList = cachedListeners;
    }

    let i = 0;
    let l = cachedListeners.length;
    for (; i < l; i++) {
      cachedListeners[i](data);
    }
  }
}
