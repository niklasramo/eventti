import type { Emitter, Events } from '../Emitter';
export declare function emitBatch<T extends Events, S extends keyof T>(emitter: Emitter<T>, eventNames: [S, ...(keyof T)[]], ...args: Parameters<T[S]>): void;
