export declare type EventType = string | number | symbol;
export declare type EventListener = (...data: any) => any;
export declare type EventListenerId = symbol;
export declare type Events = Record<EventType, EventListener>;
