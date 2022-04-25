export type EmitterEventType = string | number | symbol;

export type EmitterEventListener = (eventData: any) => any;

export interface EmitterEvents {
  [eventType: EmitterEventType]: EmitterEventListener;
}

export class Emitter<Events extends EmitterEvents> {
  protected _events: Map<
    EmitterEventType,
    {
      listeners: Set<EmitterEventListener>;
      onceListeners: Set<EmitterEventListener>;
    }
  >;

  constructor() {
    this._events = new Map();
  }

  on<EventType extends keyof Events>(
    type: EventType,
    listener: Events[EventType]
  ): void {
    let eventData = this._events.get(type);
    if (!eventData) {
      eventData = { listeners: new Set(), onceListeners: new Set() };
      this._events.set(type, eventData);
    }
    eventData.listeners.add(listener);
  }

  once<EventType extends keyof Events>(
    type: EventType,
    listener: Events[EventType]
  ): void {
    let eventData = this._events.get(type);
    if (!eventData) {
      eventData = { listeners: new Set(), onceListeners: new Set() };
      this._events.set(type, eventData);
    }
    if (!eventData.listeners.has(listener)) {
      eventData.listeners.add(listener);
      eventData.onceListeners.add(listener);
    }
  }

  off<EventType extends keyof Events>(
    type?: EventType,
    listener?: Events[EventType]
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

    // Let's get the event data.
    const eventData = this._events.get(type);
    if (!eventData) return;

    // Delete the listener.
    eventData.listeners.delete(listener);
    eventData.onceListeners.delete(listener);

    // If the event type doesn't have any listeners left let's delete it.
    if (!eventData.listeners.size) {
      this._events.delete(type);
    }
  }

  emit<EventType extends keyof Events>(
    type: EventType,
    data: Parameters<Events[EventType]>[0]
  ): void {
    const eventData = this._events.get(type);
    if (!eventData) return;

    const { listeners, onceListeners } = eventData;

    // We need to clone the listeners in order to guarantee the execution of
    // all the listeners that exist currently. If we didn't do this then
    // adding/removing listeners within the listener callbacks would affect
    // the processing of the listeners.
    const clonedListeners = [...listeners];

    // Delete once listeners.
    if (onceListeners.size) {
      for (const listener of onceListeners) {
        listeners.delete(listener);
      }
      onceListeners.clear();
    }

    // Execute all event listeners.
    let i = 0;
    let l = clonedListeners.length;
    for (; i < l; i++) {
      clonedListeners[i](data);
    }
  }
}
