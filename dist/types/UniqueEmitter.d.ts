import { EventType, EventListener, Events } from './types';
interface EventData {
    listeners: Set<EventListener>;
    onceListeners: Set<EventListener>;
    emitList: EventListener[] | null;
}
export declare class UniqueEmitter<T extends Events> {
    protected _events: Map<EventType, EventData>;
    constructor();
    protected _createEventData<EventType extends keyof T>(type: EventType): EventData;
    on<EventType extends keyof T>(type: EventType, listener: T[EventType]): void;
    once<EventType extends keyof T>(type: EventType, listener: T[EventType]): void;
    off<EventType extends keyof T>(type?: EventType, listener?: T[EventType]): void;
    emit<EventType extends keyof T>(type: EventType, data: Parameters<T[EventType]>[0]): void;
}
export {};
