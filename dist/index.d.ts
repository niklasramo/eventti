type EventName = string | number | symbol;
type EventListener = (...data: any) => any;
type EventListenerId = string | number | symbol | bigint | Function | Object;
type Events = Record<EventName, EventListener>;
declare const EmitterDedupeMode: {
    readonly ADD: "add";
    readonly UPDATE: "update";
    readonly IGNORE: "ignore";
    readonly THROW: "throw";
};
type EmitterDedupeMode = (typeof EmitterDedupeMode)[keyof typeof EmitterDedupeMode];
type EmitterOptions = {
    dedupeMode?: EmitterDedupeMode;
    createId?: (listener: EventListener) => EventListenerId;
};
declare class EventData {
    idMap: Map<EventListenerId, EventListener>;
    emitList: EventListener[] | null;
    constructor();
    add(listener: EventListener, listenerId: EventListenerId, idDedupeMode: EmitterDedupeMode): EventListenerId;
    del(listenerId: EventListenerId): void;
}
declare class Emitter<T extends Events> {
    dedupeMode: EmitterDedupeMode;
    createId: (listener: EventListener) => EventListenerId;
    protected _events: Map<EventName, EventData>;
    constructor(options?: EmitterOptions);
    protected _getListeners<EventName extends keyof T>(eventName: EventName): EventListener[] | null;
    on<EventName extends keyof T>(eventName: EventName, listener: T[EventName], listenerId?: EventListenerId): EventListenerId;
    once<EventName extends keyof T>(eventName: EventName, listener: T[EventName], listenerId?: EventListenerId): EventListenerId;
    off<EventName extends keyof T>(eventName?: EventName, listenerId?: EventListenerId): void;
    emit<EventName extends keyof T>(eventName: EventName, ...args: Parameters<T[EventName]>): void;
    listenerCount<EventName extends keyof T>(eventName?: EventName): number;
}

export { Emitter, EmitterDedupeMode, type EmitterOptions, type EventListener, type EventListenerId, type EventName, type Events };
