(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('chai')) :
    typeof define === 'function' && define.amd ? define(['chai'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.chai));
})(this, (function (chai) { 'use strict';

    const EventListenerIdDedupeMode = {
        APPEND: 'append',
        UPDATE: 'update',
        IGNORE: 'ignore',
        THROW: 'throw',
    };
    function getOrCreateEventData(events, eventName) {
        let eventData = events.get(eventName);
        if (!eventData) {
            eventData = new EventData();
            events.set(eventName, eventData);
        }
        return eventData;
    }
    class EventData {
        constructor() {
            this.idMap = new Map();
            this.fnMap = new Map();
            this.onceList = new Set();
            this.emitList = null;
        }
        add(listener, once, listenerId, idDedupeMode, allowDuplicateListeners) {
            // Handle duplicate listeners.
            if (!allowDuplicateListeners && this.fnMap.has(listener)) {
                throw new Error('Emitter: tried to add an existing event listener to an event!');
            }
            // Handle duplicate ids.
            if (this.idMap.has(listenerId)) {
                switch (idDedupeMode) {
                    case EventListenerIdDedupeMode.THROW: {
                        throw new Error('Emitter: tried to add an existing event listener id to an event!');
                    }
                    case EventListenerIdDedupeMode.IGNORE: {
                        return listenerId;
                    }
                    default: {
                        this.delId(listenerId, idDedupeMode === EventListenerIdDedupeMode.UPDATE);
                    }
                }
            }
            // Get existing listener ids for the listener (create if non-existent).
            let listenerIds = this.fnMap.get(listener);
            if (!listenerIds) {
                listenerIds = new Set();
                this.fnMap.set(listener, listenerIds);
            }
            // Store listener and listener id.
            listenerIds.add(listenerId);
            this.idMap.set(listenerId, listener);
            // Add to once list if needed.
            if (once) {
                this.onceList.add(listenerId);
            }
            // Add to emit list if needed. We can safely add new listeners to the
            // end of emit list even if it is currently looping, but we can't remove
            // items from it.
            if (this.emitList) {
                this.emitList.push(listener);
            }
            return listenerId;
        }
        delId(listenerId, ignoreIdMap = false) {
            const listener = this.idMap.get(listenerId);
            if (!listener)
                return;
            const listenerIds = this.fnMap.get(listener);
            if (!ignoreIdMap) {
                this.idMap.delete(listenerId);
            }
            this.onceList.delete(listenerId);
            listenerIds.delete(listenerId);
            if (!listenerIds.size) {
                this.fnMap.delete(listener);
            }
            this.emitList = null;
        }
        delFn(listener) {
            const listenerIds = this.fnMap.get(listener);
            if (!listenerIds)
                return;
            listenerIds.forEach((listenerId) => {
                this.onceList.delete(listenerId);
                this.idMap.delete(listenerId);
            });
            this.fnMap.delete(listener);
            this.emitList = null;
        }
    }
    class Emitter {
        constructor(options = {}) {
            const { idDedupeMode = EventListenerIdDedupeMode.APPEND, allowDuplicateListeners = true } = options;
            this.idDedupeMode = idDedupeMode;
            this.allowDuplicateListeners = allowDuplicateListeners;
            this._events = new Map();
        }
        _getListeners(eventName) {
            const eventData = this._events.get(eventName);
            if (!eventData)
                return null;
            const { idMap, onceList } = eventData;
            // Return early if there are no listeners.
            if (!idMap.size)
                return null;
            // Get the listeners for this emit process. If we have cached listeners
            // in event data (emit list) we use that, and fallback to cloning the
            // listeners from the id map. The listeners we loop should be just a
            // simple array for best performance. Cloning the listeners is expensive,
            // which is why we do it only when absolutely needed.
            const listeners = eventData.emitList || [...idMap.values()];
            // Delete all once listeners _after_ the clone operation. We don't want
            // to touch the cloned/cached listeners here, but only the "live" data.
            if (onceList.size) {
                // If once list has all the listener ids we can just delete the event
                // and be done with it.
                if (onceList.size === idMap.size) {
                    this._events.delete(eventName);
                }
                // Otherwise, let's delete the once listeners one by one.
                else {
                    for (const listenerId of onceList) {
                        eventData.delId(listenerId);
                    }
                }
            }
            // In case there are no once listeners we can cache the listeners array.
            else {
                eventData.emitList = listeners;
            }
            return listeners;
        }
        on(eventName, listener, listenerId = Symbol()) {
            return getOrCreateEventData(this._events, eventName).add(listener, false, listenerId, this.idDedupeMode, this.allowDuplicateListeners);
        }
        once(eventName, listener, listenerId = Symbol()) {
            return getOrCreateEventData(this._events, eventName).add(listener, true, listenerId, this.idDedupeMode, this.allowDuplicateListeners);
        }
        off(eventName, listener) {
            // If name is undefined, let's remove all listeners from the emitter.
            if (eventName === undefined) {
                this._events.clear();
                return;
            }
            // If listener is undefined, let's remove all listeners linked to the
            // event name.
            if (listener === undefined) {
                this._events.delete(eventName);
                return;
            }
            // Let's get the event data for the listener.
            const eventData = this._events.get(eventName);
            if (!eventData)
                return;
            // If listener is a function let's delete all instances of it from the
            // event name.
            if (typeof listener === 'function') {
                eventData.delFn(listener);
            }
            // If the listener is a listener id let's delete the specific listener.
            else {
                eventData.delId(listener);
            }
            // If the event name doesn't have any listeners left let's delete it.
            if (!eventData.idMap.size) {
                this._events.delete(eventName);
            }
        }
        emit(eventName, ...args) {
            const listeners = this._getListeners(eventName);
            if (!listeners)
                return;
            // Execute the current event listeners. Basic for loop for the win. Here
            // it's important to cache the listeners' length as the listeners array may
            // grow during execution (but not shrink).
            let i = 0;
            let l = listeners.length;
            for (; i < l; i++) {
                listeners[i](...args);
            }
        }
        listenerCount(eventName) {
            if (eventName === undefined) {
                let count = 0;
                this._events.forEach((_value, key) => {
                    count += this.listenerCount(key);
                });
                return count;
            }
            return this._events.get(eventName)?.idMap.size || 0;
        }
    }

    describe('eventName', () => {
        it(`should be allowed to be a string, number or symbol in all methods`, () => {
            ['', 'foo', 0, 1, -1, Infinity, -Infinity, Symbol()].forEach((eventName) => {
                const emitter = new Emitter();
                let counter = 0;
                emitter.on(eventName, () => {
                    ++counter;
                });
                emitter.once(eventName, () => {
                    ++counter;
                });
                chai.assert.equal(emitter.listenerCount(eventName), 2);
                emitter.emit(eventName);
                chai.assert.equal(counter, 2);
                emitter.off(eventName);
                chai.assert.equal(emitter.listenerCount(eventName), 0);
            });
        });
    });
    describe('emitter.on()', () => {
        describe('emitter.on(eventName, listener)', () => {
            it(`should return a symbol which serves as a unique id and can be used to remove the listener`, () => {
                const emitter = new Emitter();
                let counter = 0;
                const listenerId = emitter.on('test', () => {
                    ++counter;
                });
                emitter.off('test', listenerId);
                emitter.emit('test');
                chai.assert.equal(typeof listenerId, 'symbol');
                chai.assert.equal(counter, 0);
            });
            it('should allow duplicate listeners by default', () => {
                const emitter = new Emitter();
                let counter = 0;
                const listener = () => {
                    ++counter;
                };
                emitter.on('test', listener);
                emitter.on('test', listener);
                emitter.emit('test');
                chai.assert.equal(emitter.allowDuplicateListeners, true);
                chai.assert.equal(counter, 2);
            });
            it('should throw an error when emitter.allowDuplicateListeners is false and a duplicate listener is added', () => {
                const emitter = new Emitter({ allowDuplicateListeners: false });
                const listener = () => { };
                emitter.on('test', listener);
                chai.assert.equal(emitter.allowDuplicateListeners, false);
                chai.assert.throws(() => emitter.on('test', listener));
            });
        });
        describe('emitter.on(eventName, listener, listenerId)', () => {
            it(`should accept any string, number or symbol as the listener id and always return the provided listener id, which can be used to remove the listener`, () => {
                ['', 'foo', 0, 1, -1, Infinity, -Infinity, Symbol()].forEach((listenerId) => {
                    ['ignore', 'append', 'update', 'throw'].forEach((idDedupeMode) => {
                        const emitter = new Emitter({ idDedupeMode });
                        let count = 0;
                        const listener = () => {
                            ++count;
                        };
                        chai.assert.equal(emitter.on('test', listener, listenerId), listenerId);
                        if (idDedupeMode === 'throw') {
                            try {
                                chai.assert.throws(() => emitter.on('test', listener, listenerId));
                            }
                            catch (e) { }
                        }
                        else {
                            chai.assert.equal(emitter.on('test', listener, listenerId), listenerId);
                        }
                        emitter.emit('test');
                        chai.assert.equal(count, 1);
                        chai.assert.equal(emitter.listenerCount('test'), 1);
                        emitter.off('test', listenerId);
                        chai.assert.equal(emitter.listenerCount('test'), 0);
                        emitter.emit('test');
                        chai.assert.equal(count, 1);
                    });
                });
            });
            it('should ignore the listener silenty when duplicate id is provided and emitter.idDedupeMode is set to "ignore"', () => {
                const emitter = new Emitter({ idDedupeMode: 'ignore' });
                let result = 0;
                emitter.on('test', () => void (result = 1), 'foo');
                emitter.on('test', () => void (result = 2), 'foo');
                emitter.emit('test');
                chai.assert.equal(result, 1);
            });
            it('should throw an error when duplicate id is provided and emitter.idDedupeMode is set to "throw"', () => {
                const emitter = new Emitter({ idDedupeMode: 'throw' });
                emitter.on('test', () => { }, 'foo');
                chai.assert.throws(() => emitter.on('test', () => { }, 'foo'));
            });
            it('should remove the existing listener id and append the new listener id to the listener queue when duplicate id is provided and emitter.idDedupeMode is set to "append"', () => {
                const emitter = new Emitter({ idDedupeMode: 'append' });
                let result = '';
                emitter.on('test', () => void (result += '1'), 'foo');
                emitter.on('test', () => void (result += '2'));
                emitter.on('test', () => void (result += '3'), 'foo');
                emitter.emit('test');
                chai.assert.equal(result, '23');
            });
            it('should update the existing listener id`s listener with the new listener when duplicate id is provided and emitter.idDedupeMode is set to "update"', () => {
                const emitter = new Emitter({ idDedupeMode: 'update' });
                let result = '';
                emitter.on('test', () => void (result += '1'), 'foo');
                emitter.on('test', () => void (result += '2'));
                emitter.on('test', () => void (result += '3'), 'foo');
                emitter.emit('test');
                chai.assert.equal(result, '32');
            });
        });
    });
    describe('emitter.once()', () => {
        describe('emitter.once(eventName, listener)', () => {
            it(`should return a symbol which serves as a unique id and can be used to remove the listener`, () => {
                const emitter = new Emitter();
                let counter = 0;
                const listenerId = emitter.once('test', () => {
                    ++counter;
                });
                emitter.off('test', listenerId);
                emitter.emit('test');
                chai.assert.equal(typeof listenerId, 'symbol');
                chai.assert.equal(counter, 0);
            });
            it('should allow duplicate listeners by default', () => {
                const emitter = new Emitter();
                let counter = 0;
                const listener = () => {
                    ++counter;
                };
                emitter.once('test', listener);
                emitter.once('test', listener);
                emitter.emit('test');
                chai.assert.equal(emitter.allowDuplicateListeners, true);
                chai.assert.equal(counter, 2);
            });
            it('should throw an error when emitter.allowDuplicateListeners is false and a duplicate listener is added', () => {
                const emitter = new Emitter({ allowDuplicateListeners: false });
                const listener = () => { };
                emitter.once('test', listener);
                chai.assert.equal(emitter.allowDuplicateListeners, false);
                chai.assert.throws(() => emitter.once('test', listener));
            });
            it(`should only trigger once`, () => {
                const emitter = new Emitter();
                let counter = 0;
                const onTest = () => {
                    emitter.off('test', onTest);
                    emitter.emit('test');
                };
                const onceTest = () => {
                    ++counter;
                };
                emitter.on('test', onTest);
                emitter.once('test', onceTest);
                emitter.emit('test');
                emitter.emit('test');
                chai.assert.equal(counter, 1);
            });
        });
        describe('emitter.once(eventName, listener, listenerId)', () => {
            it(`should accept any string, number or symbol as the listener id and always return the provided listener id, which can be used to remove the listener`, () => {
                ['', 'foo', 0, 1, -1, Infinity, -Infinity, Symbol()].forEach((listenerId) => {
                    ['ignore', 'append', 'update', 'throw'].forEach((idDedupeMode) => {
                        const emitter = new Emitter({ idDedupeMode });
                        let count = 0;
                        const listener = () => {
                            ++count;
                        };
                        chai.assert.equal(emitter.once('test', listener, listenerId), listenerId);
                        if (idDedupeMode === 'throw') {
                            chai.assert.throws(() => emitter.once('test', listener, listenerId));
                        }
                        else {
                            chai.assert.equal(emitter.once('test', listener, listenerId), listenerId);
                        }
                        emitter.emit('test');
                        chai.assert.equal(count, 1);
                        emitter.once('test', listener, listenerId);
                        emitter.off('test', listenerId);
                        emitter.emit('test');
                        chai.assert.equal(count, 1);
                    });
                });
            });
            it('should ignore the listener silenty when duplicate id is provided and emitter.idDedupeMode is set to "ignore"', () => {
                const emitter = new Emitter({ idDedupeMode: 'ignore' });
                let result = 0;
                emitter.once('test', () => void (result = 1), 'foo');
                emitter.once('test', () => void (result = 2), 'foo');
                emitter.emit('test');
                chai.assert.equal(result, 1);
            });
            it('should throw an error when duplicate id is provided and emitter.idDedupeMode is set to "throw"', () => {
                const emitter = new Emitter({ idDedupeMode: 'throw' });
                emitter.once('test', () => { }, 'foo');
                chai.assert.throws(() => emitter.once('test', () => { }, 'foo'));
            });
            it('should remove the existing listener id and append the new listener id to the listener queue when duplicate id is provided and emitter.idDedupeMode is set to "append"', () => {
                const emitter = new Emitter({ idDedupeMode: 'append' });
                let result = '';
                emitter.once('test', () => void (result += '1'), 'foo');
                emitter.once('test', () => void (result += '2'));
                emitter.once('test', () => void (result += '3'), 'foo');
                emitter.emit('test');
                chai.assert.equal(result, '23');
            });
            it('should update the existing listener id`s listener with the new listener when duplicate id is provided and emitter.idDedupeMode is set to "update"', () => {
                const emitter = new Emitter({ idDedupeMode: 'update' });
                let result = '';
                emitter.once('test', () => void (result += '1'), 'foo');
                emitter.once('test', () => void (result += '2'));
                emitter.once('test', () => void (result += '3'), 'foo');
                emitter.emit('test');
                chai.assert.equal(result, '32');
            });
        });
    });
    describe('emitter.off()', () => {
        describe('emitter.off(eventName, listenerId)', () => {
            it(`should remove specific listener of a specific event that matches the provided listener id`, () => {
                const emitter = new Emitter();
                let value = '';
                emitter.on('test', () => {
                    value += 'a';
                });
                const b = emitter.on('test', () => {
                    value += 'b';
                });
                emitter.on('test', () => {
                    value += 'c';
                });
                emitter.off('test', b);
                emitter.emit('test');
                chai.assert.equal(value, 'ac');
            });
        });
        describe('emitter.off(eventName, listener)', () => {
            it(`should remove all listeners of a specific event that matches the provided listener`, () => {
                const emitter = new Emitter();
                let value = '';
                const listenerA = () => {
                    value += 'a';
                };
                const listenerB = () => {
                    value += 'b';
                };
                const listenerC = () => {
                    value += 'c';
                };
                emitter.on('test', listenerA);
                emitter.on('test', listenerB);
                emitter.on('test', listenerC);
                emitter.off('test', listenerB);
                emitter.emit('test');
                chai.assert.equal(value, 'ac');
            });
        });
        describe('emitter.off(eventName)', () => {
            it(`should remove all listeners of a specific event`, () => {
                const emitter = new Emitter();
                emitter.on('pass', () => { });
                emitter.on('fail', () => chai.assert.fail());
                emitter.on('fail', () => chai.assert.fail());
                emitter.off('fail');
                emitter.emit('fail');
                chai.assert.equal(1, 1);
            });
        });
        describe('emitter.off()', () => {
            it(`should remove all events and their listeners from the emitter`, () => {
                const emitter = new Emitter();
                emitter.on('a', () => chai.assert.fail());
                emitter.on('b', () => chai.assert.fail());
                emitter.on('c', () => chai.assert.fail());
                emitter.off();
                emitter.emit('a');
                emitter.emit('b');
                emitter.emit('c');
                chai.assert.equal(1, 1);
            });
        });
    });
    describe('emitter.emit()', () => {
        describe('emitter.emit(eventName)', () => {
            it(`should emit the target event once without arguments`, () => {
                const emitter = new Emitter();
                let counter = 0;
                emitter.on('test', (...args) => {
                    chai.assert.equal(args.length, 0);
                    ++counter;
                });
                emitter.emit('test');
                chai.assert.equal(counter, 1);
            });
            it(`should execute the listeners synchronously in correct order`, () => {
                const emitter = new Emitter();
                let value = '';
                const a = emitter.on('test', () => {
                    value += 'a';
                    emitter.off('test', a);
                    emitter.off('test', b);
                    emitter.emit('test');
                });
                const b = emitter.on('test', () => {
                    value += 'b';
                    emitter.on('test', () => {
                        value += 'x';
                    });
                    emitter.emit('test');
                });
                emitter.on('test', () => {
                    value += 'c';
                });
                emitter.emit('test');
                chai.assert.equal(value, 'acbcxc');
            });
        });
        describe('emitter.emit(eventName, ...args)', () => {
            it(`should emit the target event once with arguments`, () => {
                const emitter = new Emitter();
                const args = [null, undefined, true, false, 1, 'foo', Symbol(), {}, [], new Set(), new Map()];
                let counter = 0;
                emitter.on('test', (...receivedArgs) => {
                    chai.assert.deepEqual(receivedArgs, args);
                    ++counter;
                });
                emitter.emit('test', ...args);
                chai.assert.equal(counter, 1);
            });
        });
    });
    describe('emitter.listenerCount()', () => {
        describe('emitter.listenerCount(eventName)', () => {
            it(`should return the amount of listeners for the provided event`, () => {
                const emitter = new Emitter();
                emitter.on('a', () => { });
                emitter.on('b', () => { });
                emitter.on('b', () => { });
                emitter.on('c', () => { });
                emitter.on('c', () => { });
                emitter.on('c', () => { });
                chai.assert.equal(emitter.listenerCount('a'), 1);
                chai.assert.equal(emitter.listenerCount('b'), 2);
                chai.assert.equal(emitter.listenerCount('c'), 3);
            });
        });
        describe('emitter.listenerCount()', () => {
            it(`should return the amount of all listeners in the emitter`, () => {
                const emitter = new Emitter();
                emitter.on('a', () => { });
                emitter.on('b', () => { });
                emitter.on('b', () => { });
                emitter.on('c', () => { });
                emitter.on('c', () => { });
                emitter.on('c', () => { });
                chai.assert.equal(emitter.listenerCount(), 6);
            });
        });
    });

}));
