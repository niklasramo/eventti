export type EventName = string | number | symbol;

export type EventListener = (...data: any) => any;

export type EventListenerId = symbol;

export type Events = Record<EventName, EventListener>;
