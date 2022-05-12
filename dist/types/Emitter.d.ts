import { EventName, EventListener, EventListenerId, Events } from './types';
declare class EventData {
    idMap: Map<EventListenerId, EventListener>;
    fnMap: Map<EventListener, Set<EventListenerId>>;
    onceList: Set<EventListenerId>;
    emitList: EventListener[] | null;
    constructor();
    add(listener: EventListener, once?: boolean): EventListenerId;
    delId(listenerId: EventListenerId): void;
    delFn(listener: EventListener): void;
}
export declare class Emitter<T extends Events> {
    protected _events: Map<EventName, EventData>;
    constructor();
    protected _getListeners<EventName extends keyof T>(eventName: EventName): EventListener[] | null;
    on<EventName extends keyof T>(eventName: EventName, listener: T[EventName]): EventListenerId;
    once<EventName extends keyof T>(eventName: EventName, listener: T[EventName]): EventListenerId;
    off<EventName extends keyof T>(eventName?: EventName, listener?: T[EventName] | EventListenerId): void;
    emit<EventName extends keyof T>(eventName: EventName, ...args: Parameters<T[EventName]>): void;
    listenerCount<EventName extends keyof T>(eventName?: EventName): void | number;
}
export {};
