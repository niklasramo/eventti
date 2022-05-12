import { EventName, EventListener, Events } from './types';
interface EventData {
    list: Set<EventListener>;
    onceList: Set<EventListener>;
    emitList: EventListener[] | null;
}
export declare class UniqueEmitter<T extends Events> {
    protected _events: Map<EventName, EventData>;
    constructor();
    protected _getListeners<EventName extends keyof T>(eventName: EventName): EventListener[] | null;
    on<EventName extends keyof T>(eventName: EventName, listener: T[EventName]): T[EventName];
    once<EventName extends keyof T>(eventName: EventName, listener: T[EventName]): T[EventName];
    off<EventName extends keyof T>(eventName?: EventName, listener?: T[EventName]): void;
    emit<EventName extends keyof T>(eventName: EventName, ...args: Parameters<T[EventName]>): void;
    listenerCount<EventName extends keyof T>(eventName?: EventName): void | number;
}
export {};
