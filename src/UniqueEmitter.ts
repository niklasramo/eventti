import { EventType, EventListener, Events } from './types';

interface EventData {
  listeners: Set<EventListener>;
  onceListeners: Set<EventListener>;
  emitList: EventListener[] | null;
}

export class UniqueEmitter<T extends Events> {
  protected _events: Map<EventType, EventData>;

  constructor() {
    this._events = new Map();
  }

  protected _createEventData<EventType extends keyof T>(type: EventType): EventData {
    const eventData: EventData = {
      listeners: new Set(),
      onceListeners: new Set(),
      emitList: null,
    };
    this._events.set(type, eventData);
    return eventData;
  }

  on<EventType extends keyof T>(type: EventType, listener: T[EventType]): T[EventType] {
    const { listeners, emitList } = this._events.get(type) || this._createEventData(type);
    if (!listeners.has(listener)) {
      listeners.add(listener);
      emitList?.push(listener);
    }
    return listener;
  }

  once<EventType extends keyof T>(type: EventType, listener: T[EventType]): T[EventType] {
    const { listeners, onceListeners, emitList } =
      this._events.get(type) || this._createEventData(type);
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

    const listeners = eventData.emitList || [...eventData.listeners];

    if (eventData.onceListeners.size) {
      eventData.emitList = null;
      for (const listener of eventData.onceListeners) {
        eventData.listeners.delete(listener);
      }
      eventData.onceListeners.clear();
    } else {
      eventData.emitList = listeners;
    }

    let i = 0;
    let l = listeners.length;
    for (; i < l; i++) {
      listeners[i](data);
    }
  }
}
