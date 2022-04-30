export declare type EventName = string | number | symbol;
export declare type EventListener = (...data: any) => any;
export declare type EventListenerId = symbol;
export declare type Events = Record<EventName, EventListener>;
