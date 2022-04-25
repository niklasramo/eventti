export declare type EmitterEventType = string | number | symbol;
export declare type EmitterEventListener = (eventData: any) => any;
export interface EmitterEvents {
    [eventType: EmitterEventType]: EmitterEventListener;
}
export declare class Emitter<Events extends EmitterEvents> {
    protected _events: Map<EmitterEventType, {
        listeners: Set<EmitterEventListener>;
        onceListeners: Set<EmitterEventListener>;
    }>;
    constructor();
    on<EventType extends keyof Events>(type: EventType, listener: Events[EventType]): void;
    once<EventType extends keyof Events>(type: EventType, listener: Events[EventType]): void;
    off<EventType extends keyof Events>(type?: EventType, listener?: Events[EventType]): void;
    emit<EventType extends keyof Events>(type: EventType, data: Parameters<Events[EventType]>[0]): void;
}
