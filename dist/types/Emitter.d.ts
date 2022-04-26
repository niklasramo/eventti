import { EventType, EventListener, EventListenerId, Events } from './types';
declare class EventData {
    idMap: Map<EventListenerId, EventListener>;
    fnMap: Map<Function, Set<EventListenerId>>;
    onceList: Set<EventListenerId>;
    emitList: EventListener[] | null;
    constructor();
    addListener(listener: EventListener, once?: boolean): EventListenerId;
    deleteListener(listenerId: EventListenerId): void;
    deleteListeners(listener: EventListener): void;
}
export declare class Emitter<T extends Events> {
    protected _events: Map<EventType, EventData>;
    constructor();
    on<EventType extends keyof T>(type: EventType, listener: T[EventType]): EventListenerId;
    once<EventType extends keyof T>(type: EventType, listener: T[EventType]): EventListenerId;
    off<EventType extends keyof T>(type?: EventType, listener?: T[EventType] | EventListenerId): void;
    emit<EventType extends keyof T>(type: EventType, ...args: Parameters<T[EventType]>): void;
}
export {};
