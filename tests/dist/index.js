// tests/src/index.ts
import { assert } from "chai";

// src/Emitter.ts
var EmitterIdDedupeMode = {
  ADD: "add",
  UPDATE: "update",
  IGNORE: "ignore",
  THROW: "throw"
};
function getOrCreateEventData(events, eventName) {
  let eventData = events.get(eventName);
  if (!eventData) {
    eventData = new EventData();
    events.set(eventName, eventData);
  }
  return eventData;
}
var EventData = class {
  constructor() {
    this.idMap = /* @__PURE__ */ new Map();
    this.cbMap = /* @__PURE__ */ new Map();
    this.onceList = /* @__PURE__ */ new Set();
    this.emitList = null;
  }
  add(listener, once, listenerId, idDedupeMode, allowDuplicateListeners) {
    if (!allowDuplicateListeners && this.cbMap.has(listener)) {
      throw new Error("Emitter: tried to add an existing event listener to an event!");
    }
    if (this.idMap.has(listenerId)) {
      switch (idDedupeMode) {
        case EmitterIdDedupeMode.THROW: {
          throw new Error("Emitter: tried to add an existing event listener id to an event!");
        }
        case EmitterIdDedupeMode.IGNORE: {
          return listenerId;
        }
        default: {
          this.delId(listenerId, idDedupeMode === EmitterIdDedupeMode.UPDATE);
        }
      }
    }
    let listenerIds = this.cbMap.get(listener);
    if (!listenerIds) {
      listenerIds = /* @__PURE__ */ new Set();
      this.cbMap.set(listener, listenerIds);
    }
    listenerIds.add(listenerId);
    this.idMap.set(listenerId, listener);
    if (once) {
      this.onceList.add(listenerId);
    }
    if (this.emitList) {
      this.emitList.push(listener);
    }
    return listenerId;
  }
  delId(listenerId, ignoreIdMap = false) {
    const listener = this.idMap.get(listenerId);
    if (!listener)
      return;
    const listenerIds = this.cbMap.get(listener);
    if (!ignoreIdMap) {
      this.idMap.delete(listenerId);
    }
    this.onceList.delete(listenerId);
    listenerIds.delete(listenerId);
    if (!listenerIds.size) {
      this.cbMap.delete(listener);
    }
    this.emitList = null;
  }
  delFn(listener) {
    const listenerIds = this.cbMap.get(listener);
    if (!listenerIds)
      return;
    for (const listenerId of listenerIds) {
      this.onceList.delete(listenerId);
      this.idMap.delete(listenerId);
    }
    this.cbMap.delete(listener);
    this.emitList = null;
  }
};
var Emitter = class {
  constructor(options = {}) {
    const { idDedupeMode = EmitterIdDedupeMode.ADD, allowDuplicateListeners = true } = options;
    this.idDedupeMode = idDedupeMode;
    this.createId = options.createId || Symbol;
    this.allowDuplicateListeners = allowDuplicateListeners;
    this._events = /* @__PURE__ */ new Map();
  }
  _getListeners(eventName) {
    const eventData = this._events.get(eventName);
    if (!eventData)
      return null;
    const { idMap, onceList } = eventData;
    if (!idMap.size)
      return null;
    const listeners = eventData.emitList || [...idMap.values()];
    if (onceList.size) {
      if (onceList.size === idMap.size) {
        this._events.delete(eventName);
      } else {
        for (const listenerId of onceList) {
          eventData.delId(listenerId);
        }
      }
    } else {
      eventData.emitList = listeners;
    }
    return listeners;
  }
  on(eventName, listener, listenerId = this.createId()) {
    return getOrCreateEventData(this._events, eventName).add(
      listener,
      false,
      listenerId,
      this.idDedupeMode,
      this.allowDuplicateListeners
    );
  }
  once(eventName, listener, listenerId = this.createId()) {
    return getOrCreateEventData(this._events, eventName).add(
      listener,
      true,
      listenerId,
      this.idDedupeMode,
      this.allowDuplicateListeners
    );
  }
  off(eventName, listener) {
    if (eventName === void 0) {
      this._events.clear();
      return;
    }
    if (listener === void 0) {
      this._events.delete(eventName);
      return;
    }
    const eventData = this._events.get(eventName);
    if (!eventData)
      return;
    if (typeof listener === "function") {
      eventData.delFn(listener);
    } else {
      eventData.delId(listener);
    }
    if (!eventData.idMap.size) {
      this._events.delete(eventName);
    }
  }
  emit(eventName, ...args) {
    const listeners = this._getListeners(eventName);
    if (!listeners)
      return;
    let i = 0;
    let l = listeners.length;
    for (; i < l; i++) {
      listeners[i](...args);
    }
  }
  listenerCount(eventName) {
    if (eventName === void 0) {
      let count = 0;
      this._events.forEach((_value, key) => {
        count += this.listenerCount(key);
      });
      return count;
    }
    return this._events.get(eventName)?.idMap.size || 0;
  }
};

// tests/src/index.ts
describe("eventName", () => {
  it(`should be allowed to be a string, number or symbol in all methods`, () => {
    ["", "foo", 0, 1, -1, Infinity, -Infinity, Symbol()].forEach((eventName) => {
      const emitter = new Emitter();
      let counter = 0;
      emitter.on(eventName, () => {
        ++counter;
      });
      emitter.once(eventName, () => {
        ++counter;
      });
      assert.equal(emitter.listenerCount(eventName), 2);
      emitter.emit(eventName);
      assert.equal(counter, 2);
      emitter.off(eventName);
      assert.equal(emitter.listenerCount(eventName), 0);
    });
  });
});
describe("emitter.on()", () => {
  describe("emitter.on(eventName, listener)", () => {
    it(`should return a symbol which serves as a unique id and can be used to remove the listener`, () => {
      const emitter = new Emitter();
      let counter = 0;
      const listenerId = emitter.on("test", () => {
        ++counter;
      });
      emitter.off("test", listenerId);
      emitter.emit("test");
      assert.equal(typeof listenerId, "symbol");
      assert.equal(counter, 0);
    });
    it("should allow duplicate listeners by default", () => {
      const emitter = new Emitter();
      let counter = 0;
      const listener = () => {
        ++counter;
      };
      emitter.on("test", listener);
      emitter.on("test", listener);
      emitter.emit("test");
      assert.equal(emitter.allowDuplicateListeners, true);
      assert.equal(counter, 2);
    });
    it("should throw an error when emitter.allowDuplicateListeners is false and a duplicate listener is added", () => {
      const emitter = new Emitter({ allowDuplicateListeners: false });
      const listener = () => {
      };
      emitter.on("test", listener);
      assert.equal(emitter.allowDuplicateListeners, false);
      assert.throws(() => emitter.on("test", listener));
    });
  });
  describe("emitter.on(eventName, listener, listenerId)", () => {
    it(`should accept any string, number or symbol as the listener id and always return the provided listener id, which can be used to remove the listener`, () => {
      ["", "foo", 0, 1, -1, Infinity, -Infinity, Symbol()].forEach((listenerId) => {
        ["add", "update", "ignore", "throw"].forEach((idDedupeMode) => {
          const emitter = new Emitter({ idDedupeMode });
          let count = 0;
          const listener = () => {
            ++count;
          };
          assert.equal(emitter.on("test", listener, listenerId), listenerId);
          if (idDedupeMode === "throw") {
            try {
              assert.throws(() => emitter.on("test", listener, listenerId));
            } catch (e) {
            }
          } else {
            assert.equal(emitter.on("test", listener, listenerId), listenerId);
          }
          emitter.emit("test");
          assert.equal(count, 1);
          assert.equal(emitter.listenerCount("test"), 1);
          emitter.off("test", listenerId);
          assert.equal(emitter.listenerCount("test"), 0);
          emitter.emit("test");
          assert.equal(count, 1);
        });
      });
    });
    it('should ignore the listener silenty when duplicate id is provided and emitter.idDedupeMode is set to "ignore"', () => {
      const emitter = new Emitter({ idDedupeMode: "ignore" });
      let result = 0;
      emitter.on("test", () => void (result = 1), "foo");
      emitter.on("test", () => void (result = 2), "foo");
      emitter.emit("test");
      assert.equal(result, 1);
    });
    it('should throw an error when duplicate id is provided and emitter.idDedupeMode is set to "throw"', () => {
      const emitter = new Emitter({ idDedupeMode: "throw" });
      emitter.on("test", () => {
      }, "foo");
      assert.throws(() => emitter.on("test", () => {
      }, "foo"));
    });
    it('should remove the existing listener id and append the new listener id to the listener queue when duplicate id is provided and emitter.idDedupeMode is set to "add"', () => {
      const emitter = new Emitter({ idDedupeMode: "add" });
      let result = "";
      emitter.on("test", () => void (result += "1"), "foo");
      emitter.on("test", () => void (result += "2"));
      emitter.on("test", () => void (result += "3"), "foo");
      emitter.emit("test");
      assert.equal(result, "23");
    });
    it('should update the existing listener id`s listener with the new listener when duplicate id is provided and emitter.idDedupeMode is set to "update"', () => {
      const emitter = new Emitter({ idDedupeMode: "update" });
      let result = "";
      emitter.on("test", () => void (result += "1"), "foo");
      emitter.on("test", () => void (result += "2"));
      emitter.on("test", () => void (result += "3"), "foo");
      emitter.emit("test");
      assert.equal(result, "32");
    });
  });
});
describe("emitter.once()", () => {
  describe("emitter.once(eventName, listener)", () => {
    it(`should return a symbol which serves as a unique id and can be used to remove the listener`, () => {
      const emitter = new Emitter();
      let counter = 0;
      const listenerId = emitter.once("test", () => {
        ++counter;
      });
      emitter.off("test", listenerId);
      emitter.emit("test");
      assert.equal(typeof listenerId, "symbol");
      assert.equal(counter, 0);
    });
    it("should allow duplicate listeners by default", () => {
      const emitter = new Emitter();
      let counter = 0;
      const listener = () => {
        ++counter;
      };
      emitter.once("test", listener);
      emitter.once("test", listener);
      emitter.emit("test");
      assert.equal(emitter.allowDuplicateListeners, true);
      assert.equal(counter, 2);
    });
    it("should throw an error when emitter.allowDuplicateListeners is false and a duplicate listener is added", () => {
      const emitter = new Emitter({ allowDuplicateListeners: false });
      const listener = () => {
      };
      emitter.once("test", listener);
      assert.equal(emitter.allowDuplicateListeners, false);
      assert.throws(() => emitter.once("test", listener));
    });
    it(`should only trigger once`, () => {
      const emitter = new Emitter();
      let counter = 0;
      const onTest = () => {
        emitter.off("test", onTest);
        emitter.emit("test");
      };
      const onceTest = () => {
        ++counter;
      };
      emitter.on("test", onTest);
      emitter.once("test", onceTest);
      emitter.emit("test");
      emitter.emit("test");
      assert.equal(counter, 1);
    });
  });
  describe("emitter.once(eventName, listener, listenerId)", () => {
    it(`should accept any string, number or symbol as the listener id and always return the provided listener id, which can be used to remove the listener`, () => {
      ["", "foo", 0, 1, -1, Infinity, -Infinity, Symbol()].forEach((listenerId) => {
        ["add", "update", "ignore", "throw"].forEach((idDedupeMode) => {
          const emitter = new Emitter({ idDedupeMode });
          let count = 0;
          const listener = () => {
            ++count;
          };
          assert.equal(emitter.once("test", listener, listenerId), listenerId);
          if (idDedupeMode === "throw") {
            assert.throws(() => emitter.once("test", listener, listenerId));
          } else {
            assert.equal(emitter.once("test", listener, listenerId), listenerId);
          }
          emitter.emit("test");
          assert.equal(count, 1);
          emitter.once("test", listener, listenerId);
          emitter.off("test", listenerId);
          emitter.emit("test");
          assert.equal(count, 1);
        });
      });
    });
    it('should ignore the listener silenty when duplicate id is provided and emitter.idDedupeMode is set to "ignore"', () => {
      const emitter = new Emitter({ idDedupeMode: "ignore" });
      let result = 0;
      emitter.once("test", () => void (result = 1), "foo");
      emitter.once("test", () => void (result = 2), "foo");
      emitter.emit("test");
      assert.equal(result, 1);
    });
    it('should throw an error when duplicate id is provided and emitter.idDedupeMode is set to "throw"', () => {
      const emitter = new Emitter({ idDedupeMode: "throw" });
      emitter.once("test", () => {
      }, "foo");
      assert.throws(() => emitter.once("test", () => {
      }, "foo"));
    });
    it('should remove the existing listener id and append the new listener id to the listener queue when duplicate id is provided and emitter.idDedupeMode is set to "add"', () => {
      const emitter = new Emitter({ idDedupeMode: "add" });
      let result = "";
      emitter.once("test", () => void (result += "1"), "foo");
      emitter.once("test", () => void (result += "2"));
      emitter.once("test", () => void (result += "3"), "foo");
      emitter.emit("test");
      assert.equal(result, "23");
    });
    it('should update the existing listener id`s listener with the new listener when duplicate id is provided and emitter.idDedupeMode is set to "update"', () => {
      const emitter = new Emitter({ idDedupeMode: "update" });
      let result = "";
      emitter.once("test", () => void (result += "1"), "foo");
      emitter.once("test", () => void (result += "2"));
      emitter.once("test", () => void (result += "3"), "foo");
      emitter.emit("test");
      assert.equal(result, "32");
    });
  });
});
describe("emitter.off()", () => {
  describe("emitter.off(eventName, listenerId)", () => {
    it(`should remove specific listener of a specific event that matches the provided listener id`, () => {
      const emitter = new Emitter();
      let value = "";
      emitter.on("test", () => {
        value += "a";
      });
      const b = emitter.on("test", () => {
        value += "b";
      });
      emitter.on("test", () => {
        value += "c";
      });
      emitter.off("test", b);
      emitter.emit("test");
      assert.equal(value, "ac");
    });
  });
  describe("emitter.off(eventName, listener)", () => {
    it(`should remove all listeners of a specific event that matches the provided listener`, () => {
      const emitter = new Emitter();
      let value = "";
      const listenerA = () => {
        value += "a";
      };
      const listenerB = () => {
        value += "b";
      };
      const listenerC = () => {
        value += "c";
      };
      emitter.on("test", listenerA);
      emitter.on("test", listenerB);
      emitter.on("test", listenerC);
      emitter.off("test", listenerB);
      emitter.emit("test");
      assert.equal(value, "ac");
    });
  });
  describe("emitter.off(eventName)", () => {
    it(`should remove all listeners of a specific event`, () => {
      const emitter = new Emitter();
      emitter.on("pass", () => {
      });
      emitter.on("fail", () => assert.fail());
      emitter.on("fail", () => assert.fail());
      emitter.off("fail");
      emitter.emit("fail");
      assert.equal(1, 1);
    });
  });
  describe("emitter.off()", () => {
    it(`should remove all events and their listeners from the emitter`, () => {
      const emitter = new Emitter();
      emitter.on("a", () => assert.fail());
      emitter.on("b", () => assert.fail());
      emitter.on("c", () => assert.fail());
      emitter.off();
      emitter.emit("a");
      emitter.emit("b");
      emitter.emit("c");
      assert.equal(1, 1);
    });
  });
});
describe("emitter.emit()", () => {
  describe("emitter.emit(eventName)", () => {
    it(`should emit the target event once without arguments`, () => {
      const emitter = new Emitter();
      let counter = 0;
      emitter.on("test", (...args) => {
        assert.equal(args.length, 0);
        ++counter;
      });
      emitter.emit("test");
      assert.equal(counter, 1);
    });
    it(`should execute the listeners synchronously in correct order`, () => {
      const emitter = new Emitter();
      let value = "";
      const a = emitter.on("test", () => {
        value += "a";
        emitter.off("test", a);
        emitter.off("test", b);
        emitter.emit("test");
      });
      const b = emitter.on("test", () => {
        value += "b";
        emitter.on("test", () => {
          value += "x";
        });
        emitter.emit("test");
      });
      emitter.on("test", () => {
        value += "c";
      });
      emitter.emit("test");
      assert.equal(value, "acbcxc");
    });
  });
  describe("emitter.emit(eventName, ...args)", () => {
    it(`should emit the target event once with arguments`, () => {
      const emitter = new Emitter();
      const args = [null, void 0, true, false, 1, "foo", Symbol(), {}, [], /* @__PURE__ */ new Set(), /* @__PURE__ */ new Map()];
      let counter = 0;
      emitter.on("test", (...receivedArgs) => {
        assert.deepEqual(receivedArgs, args);
        ++counter;
      });
      emitter.emit("test", ...args);
      assert.equal(counter, 1);
    });
  });
});
describe("emitter.listenerCount()", () => {
  describe("emitter.listenerCount(eventName)", () => {
    it(`should return the amount of listeners for the provided event`, () => {
      const emitter = new Emitter();
      emitter.on("a", () => {
      });
      emitter.on("b", () => {
      });
      emitter.on("b", () => {
      });
      emitter.on("c", () => {
      });
      emitter.on("c", () => {
      });
      emitter.on("c", () => {
      });
      assert.equal(emitter.listenerCount("a"), 1);
      assert.equal(emitter.listenerCount("b"), 2);
      assert.equal(emitter.listenerCount("c"), 3);
    });
  });
  describe("emitter.listenerCount()", () => {
    it(`should return the amount of all listeners in the emitter`, () => {
      const emitter = new Emitter();
      emitter.on("a", () => {
      });
      emitter.on("b", () => {
      });
      emitter.on("b", () => {
      });
      emitter.on("c", () => {
      });
      emitter.on("c", () => {
      });
      emitter.on("c", () => {
      });
      assert.equal(emitter.listenerCount(), 6);
    });
  });
});
