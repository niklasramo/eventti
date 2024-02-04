type EventName = string | number | symbol;
type EventListener = (...data: any) => any;
type EventListenerId = null | string | number | symbol | bigint | Function | Object;
type Events = Record<EventName, EventListener>;
declare const EmitterDedupe: {
    readonly ADD: "add";
    readonly UPDATE: "update";
    readonly IGNORE: "ignore";
    readonly THROW: "throw";
};
type EmitterDedupe = (typeof EmitterDedupe)[keyof typeof EmitterDedupe];
type EmitterOptions = {
    dedupe?: EmitterDedupe;
    getId?: (listener: EventListener) => EventListenerId;
};
declare class Emitter<T extends Events> {
    dedupe: EmitterDedupe;
    getId: (listener: EventListener) => EventListenerId;
    protected _events: Map<EventName, {
        idMap: Map<EventListenerId, EventListener>;
        emitList: EventListener[] | null;
    }>;
    constructor(options?: EmitterOptions);
    protected _getListeners<EventName extends keyof T>(eventName: EventName): EventListener[] | null;
    on<EventName extends keyof T>(eventName: EventName, listener: T[EventName], listenerId?: EventListenerId): EventListenerId;
    once<EventName extends keyof T>(eventName: EventName, listener: T[EventName], listenerId?: EventListenerId): EventListenerId;
    off<EventName extends keyof T>(eventName?: EventName, listenerId?: EventListenerId): void;
    emit<EventName extends keyof T>(eventName: EventName, ...args: Parameters<T[EventName]>): void;
    listenerCount<EventName extends keyof T>(eventName?: EventName): number;
}

export { Emitter, EmitterDedupe, type EmitterOptions, type EventListener, type EventListenerId, type EventName, type Events };
