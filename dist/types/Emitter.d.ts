export declare type EventName = string | number | symbol;
export declare type EventListener = (...data: any) => any;
export declare type EventListenerId = string | number | symbol;
export declare type EventListenerIdDedupeMode = 'ignore' | 'throw' | 'add' | 'replace';
export declare type Events = Record<EventName, EventListener>;
export declare type EmitterOptions = {
    allowDuplicateListeners?: boolean;
    dedupe?: EventListenerIdDedupeMode;
};
declare type InternalEventMap = Map<EventName, EventData>;
declare class EventData {
    idMap: Map<EventListenerId, EventListener>;
    fnMap: Map<EventListener, Set<EventListenerId>>;
    onceList: Set<EventListenerId>;
    emitList: EventListener[] | null;
    constructor();
    add(listener: EventListener, once: boolean, listenerId: EventListenerId, dedupe: EventListenerIdDedupeMode, allowDuplicateListeners: boolean): EventListenerId;
    delId(listenerId: EventListenerId, ignoreIdMap?: boolean): void;
    delFn(listener: EventListener): void;
}
export declare class Emitter<T extends Events> {
    dedupe: EventListenerIdDedupeMode;
    readonly allowDuplicateListeners: boolean;
    protected _events: InternalEventMap;
    constructor(options?: EmitterOptions);
    protected _getListeners<EventName extends keyof T>(eventName: EventName): EventListener[] | null;
    on<EventName extends keyof T>(eventName: EventName, listener: T[EventName], listenerId?: EventListenerId): EventListenerId;
    once<EventName extends keyof T>(eventName: EventName, listener: T[EventName], listenerId?: EventListenerId): EventListenerId;
    off<EventName extends keyof T>(eventName?: EventName, listener?: T[EventName] | EventListenerId): void;
    emit<EventName extends keyof T>(eventName: EventName, ...args: Parameters<T[EventName]>): void;
    listenerCount<EventName extends keyof T>(eventName?: EventName): number;
}
export {};
