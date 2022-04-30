import { EventName, EventListener, Events } from './types';

interface EventData {
  list: Set<EventListener>;
  onceList: Set<EventListener>;
  emitList: EventListener[] | null;
}

function getOrCreateEventData(events: Map<EventName, EventData>, eventName: EventName) {
  let eventData = events.get(eventName);
  if (!eventData) {
    eventData = {
      list: new Set(),
      onceList: new Set(),
      emitList: null,
    };
    events.set(eventName, eventData);
  }
  return eventData;
}

export class UniqueEmitter<T extends Events> {
  protected _events: Map<EventName, EventData>;

  constructor() {
    this._events = new Map();
  }

  on<EventName extends keyof T>(eventName: EventName, listener: T[EventName]): T[EventName] {
    const { list, emitList } = getOrCreateEventData(this._events, eventName);
    if (!list.has(listener)) {
      list.add(listener);
      if (emitList) {
        emitList.push(listener);
      }
    }
    return listener;
  }

  once<EventName extends keyof T>(eventName: EventName, listener: T[EventName]): T[EventName] {
    const { list, onceList, emitList } = getOrCreateEventData(this._events, eventName);
    if (!list.has(listener)) {
      list.add(listener);
      onceList.add(listener);
      if (emitList) {
        emitList.push(listener);
      }
    }
    return listener;
  }

  off<EventName extends keyof T>(eventName?: EventName, listener?: T[EventName]): void {
    if (eventName === undefined) {
      this._events.clear();
      return;
    }

    if (listener === undefined) {
      this._events.delete(eventName);
      return;
    }

    const eventData = this._events.get(eventName);
    if (!eventData || !eventData.list.has(listener)) return;

    eventData.list.delete(listener);
    eventData.onceList.delete(listener);
    eventData.emitList = null;

    if (!eventData.list.size) {
      this._events.delete(eventName);
    }
  }

  emit<EventName extends keyof T>(eventName: EventName, ...args: Parameters<T[EventName]>): void {
    const eventData = this._events.get(eventName);
    if (!eventData) return;

    const { list, onceList, emitList } = eventData;

    if (!list.size) return;

    const listeners = emitList || [...list];

    if (onceList.size) {
      if (onceList.size === list.size) {
        this._events.delete(eventName);
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
