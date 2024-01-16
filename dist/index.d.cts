type EventName = string | number | symbol;
type EventListener = (...data: any) => any;
type EventListenerId = string | number | symbol;
type Events = Record<EventName, EventListener>;
declare const EmitterIdDedupeMode: {
    readonly APPEND: "append";
    readonly UPDATE: "update";
    readonly IGNORE: "ignore";
    readonly THROW: "throw";
};
type EmitterIdDedupeMode = (typeof EmitterIdDedupeMode)[keyof typeof EmitterIdDedupeMode];
type EmitterOptions = {
    allowDuplicateListeners?: boolean;
    idDedupeMode?: EmitterIdDedupeMode;
};
type InternalEventMap = Map<EventName, EventData>;
declare class EventData {
    idMap: Map<EventListenerId, EventListener>;
    fnMap: Map<EventListener, Set<EventListenerId>>;
    onceList: Set<EventListenerId>;
    emitList: EventListener[] | null;
    constructor();
    add(listener: EventListener, once: boolean, listenerId: EventListenerId, idDedupeMode: EmitterIdDedupeMode, allowDuplicateListeners: boolean): EventListenerId;
    delId(listenerId: EventListenerId, ignoreIdMap?: boolean): void;
    delFn(listener: EventListener): void;
}
declare class Emitter<T extends Events> {
    idDedupeMode: EmitterIdDedupeMode;
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

export { Emitter, EmitterIdDedupeMode, type EmitterOptions, type EventListener, type EventListenerId, type EventName, type Events };
