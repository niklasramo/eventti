import type { Emitter } from '../Emitter';
import type { UniqueEmitter } from '../UniqueEmitter';
import { Events } from '../types';
export declare class BatchEmitter<T extends Events> {
    emitter: Emitter<T> | UniqueEmitter<T>;
    protected _batch: any[];
    constructor(emitter: Emitter<T> | UniqueEmitter<T>);
    queue<EventName extends keyof T>(eventName: EventName, ...args: Parameters<T[EventName]>): void;
    emit(): void;
    clear(): void;
}
