export type EventType = string | number | symbol;

export type EventListener = (...data: any) => any;

export type EventListenerId = string | number | symbol;

export type Events = Record<EventType, EventListener>;
