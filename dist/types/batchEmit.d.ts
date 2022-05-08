import type { Emitter } from './Emitter';
import type { UniqueEmitter } from './UniqueEmitter';
import { Events } from './types';
export declare function batchEmit<T extends Events, S extends keyof T>(emitter: Emitter<T> | UniqueEmitter<T>, eventNames: [S, ...(keyof T)[]], ...args: Parameters<T[S]>): void;
