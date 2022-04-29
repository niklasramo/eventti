import { EventType, EventListener, Events } from './types';

interface EventData {
  list: Set<EventListener>;
  onceList: Set<EventListener>;
  emitList: EventListener[] | null;
}

function getOrCreateEventData(events: Map<EventType, EventData>, type: EventType) {
  let eventData = events.get(type);
  if (!eventData) {
    eventData = {
      list: new Set(),
      onceList: new Set(),
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
    const { list, emitList } = getOrCreateEventData(this._events, type);
    if (!list.has(listener)) {
      list.add(listener);
      if (emitList) {
        emitList.push(listener);
      }
    }
    return listener;
  }

  once<EventType extends keyof T>(type: EventType, listener: T[EventType]): T[EventType] {
    const { list, onceList, emitList } = getOrCreateEventData(this._events, type);
    if (!list.has(listener)) {
      list.add(listener);
      onceList.add(listener);
      if (emitList) {
        emitList.push(listener);
      }
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
    if (!eventData || !eventData.list.has(listener)) return;

    eventData.list.delete(listener);
    eventData.onceList.delete(listener);
    eventData.emitList = null;

    if (!eventData.list.size) {
      this._events.delete(type);
    }
  }

  emit<EventType extends keyof T>(type: EventType, ...args: Parameters<T[EventType]>): void {
    const eventData = this._events.get(type);
    if (!eventData) return;

    const { list, onceList, emitList } = eventData;

    if (!list.size) return;

    const listeners = emitList || [...list];

    if (onceList.size) {
      if (onceList.size === list.size) {
        this._events.delete(type);
      } else {
        for (const listener of onceList) {
          list.delete(listener);
        }
        onceList.clear();
        eventData.emitList = null;
      }
    } else {
      eventData.emitList = listeners;
    }

    let i = 0;
    let l = listeners.length;
    for (; i < l; i++) {
      listeners[i](...(args as any[]));
    }
  }
}
