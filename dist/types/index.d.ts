export declare type EmitterEventType = string | number | symbol;
export declare type EmitterEventListener = (...data: any) => any;
export declare type EmitterEventListenerId = string | number | symbol;
export declare type EmitterEvents = Record<EmitterEventType, EmitterEventListener>;
declare class EmitterEventData {
    idMap: Map<EmitterEventListenerId, Function>;
    fnMap: Map<Function, Set<EmitterEventListenerId>>;
    onceList: Set<EmitterEventListenerId>;
    constructor();
    addListener(listener: Function, once?: boolean): EmitterEventListenerId;
    deleteListenerById(listenerId: EmitterEventListenerId): void;
    deleteMatchingListeners(listener: EmitterEventListener): void;
    deleteOnceListeners(): void;
}
export declare class Emitter<Events extends EmitterEvents> {
    protected _events: Map<EmitterEventType, EmitterEventData>;
    protected _once: boolean;
    constructor();
    on<EventType extends keyof Events>(type: EventType, listener: Events[EventType]): EmitterEventListenerId;
    once<EventType extends keyof Events>(type: EventType, listener: Events[EventType]): EmitterEventListenerId;
    off<EventType extends keyof Events>(type?: EventType, listener?: Events[EventType] | EmitterEventListenerId): void;
    emit<EventType extends keyof Events>(type: EventType, ...args: Parameters<Events[EventType]>): void;
}
export {};
