type EventName = string | number | symbol;
type EventListener = (...data: any) => any;
type EventListenerId = string | number | symbol;
declare const EventListenerIdDedupeMode: {
    readonly APPEND: "append";
    readonly UPDATE: "update";
    readonly IGNORE: "ignore";
    readonly THROW: "throw";
};
type EventListenerIdDedupeMode = (typeof EventListenerIdDedupeMode)[keyof typeof EventListenerIdDedupeMode];
type Events = Record<EventName, EventListener>;
type EmitterOptions = {
    allowDuplicateListeners?: boolean;
    idDedupeMode?: EventListenerIdDedupeMode;
};
type InternalEventMap = Map<EventName, EventData>;
declare class EventData {
    idMap: Map<EventListenerId, EventListener>;
    fnMap: Map<EventListener, Set<EventListenerId>>;
    onceList: Set<EventListenerId>;
    emitList: EventListener[] | null;
    constructor();
    add(listener: EventListener, once: boolean, listenerId: EventListenerId, idDedupeMode: EventListenerIdDedupeMode, allowDuplicateListeners: boolean): EventListenerId;
    delId(listenerId: EventListenerId, ignoreIdMap?: boolean): void;
    delFn(listener: EventListener): void;
}
declare class Emitter<T extends Events> {
    idDedupeMode: EventListenerIdDedupeMode;
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

export { Emitter, type EmitterOptions, type EventListener, type EventListenerId, EventListenerIdDedupeMode, type EventName, type Events };
