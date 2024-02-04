import { assert } from 'chai';
import { Emitter, EmitterDedupe } from '../../src/index.js';

describe('event name', () => {
  it(`should be allowed to be a string, number or symbol`, () => {
    ['', 'foo', 0, 1, -1, Infinity, -Infinity, Symbol()].forEach((eventName) => {
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

describe('listener id', () => {
  it(`should be allowed to be any value except undefined`, () => {
    [
      null,
      '',
      'foo',
      0,
      1,
      -1,
      Infinity,
      -Infinity,
      Symbol(),
      true,
      false,
      [],
      {},
      () => {},
    ].forEach((listenerId) => {
      const emitter = new Emitter();
      let counter = 0;

      emitter.once(
        'test',
        () => {
          ++counter;
        },
        listenerId,
      );
      assert.equal(emitter.listenerCount(), 1);
      emitter.emit('test');
      assert.equal(emitter.listenerCount(), 0);
      assert.equal(counter, 1);

      emitter.on(
        'test',
        () => {
          ++counter;
        },
        listenerId,
      );
      emitter.emit('test');
      assert.equal(emitter.listenerCount(), 1);
      assert.equal(counter, 2);
      emitter.off('test', listenerId);
      assert.equal(emitter.listenerCount(), 0);
    });
  });
});

describe('constructor options', () => {
  describe('getId', () => {
    it(`should default to creating a new Symbol if omitted`, () => {
      const emitter = new Emitter();
      const idA = emitter.on('test', () => {});
      const idB = emitter.once('test', () => {});
      assert.equal(typeof idA, 'symbol');
      assert.equal(typeof idB, 'symbol');
      assert.notEqual(idA, idB);
    });

    it(`should be a function that generates a new listener id`, () => {
      let id = 0;
      const emitter = new Emitter({ getId: () => ++id });

      const idA = emitter.on('test', () => {});
      assert.equal(idA, id);

      const idB = emitter.once('test', () => {});
      assert.equal(idB, id);
    });

    it(`should receive the listener callback as it's only argument`, () => {
      const emitter = new Emitter({
        getId: (...args) => {
          assert.equal(args.length, 1);
          return args[0];
        },
      });

      const listenerA = () => {};
      assert.equal(emitter.on('test', listenerA), listenerA);

      const listenerB = () => {};
      assert.equal(emitter.once('test', listenerB), listenerB);
    });
  });

  describe('dedupe', () => {
    it(`should default to "add" if omitted`, () => {
      const emitter = new Emitter();
      let result = '';
      emitter.on('test', () => void (result += '1'), 'foo');
      emitter.on('test', () => void (result += '2'));
      emitter.on('test', () => void (result += '3'), 'foo');
      emitter.emit('test');
      assert.equal(result, '23');
    });

    describe('add', () => {
      it(`should add the duplicate listener to the end of the queue`, () => {
        const emitter = new Emitter({ dedupe: EmitterDedupe.ADD });
        let result = '';
        emitter.on('test', () => void (result += '1'), 'foo');
        emitter.on('test', () => void (result += '2'));
        emitter.on('test', () => void (result += '3'), 'foo');
        emitter.emit('test');
        assert.equal(result, '23');
      });
    });

    describe('update', () => {
      it(`should update the existing listener with the new listener`, () => {
        const emitter = new Emitter({ dedupe: EmitterDedupe.UPDATE });
        let result = '';
        emitter.on('test', () => void (result += '1'), 'foo');
        emitter.on('test', () => void (result += '2'));
        emitter.on('test', () => void (result += '3'), 'foo');
        emitter.emit('test');
        assert.equal(result, '32');
      });
    });

    describe('ignore', () => {
      it(`should ignore the duplicate listener`, () => {
        const emitter = new Emitter({ dedupe: EmitterDedupe.IGNORE });
        let result = 0;
        emitter.on('test', () => void (result = 1), 'foo');
        emitter.on('test', () => void (result = 2), 'foo');
        emitter.emit('test');
        assert.equal(result, 1);
      });
    });

    describe('throw', () => {
      it(`should throw an error`, () => {
        const emitter = new Emitter({ dedupe: EmitterDedupe.THROW });
        emitter.on('test', () => {}, 'foo');
        assert.throws(() => emitter.on('test', () => {}, 'foo'));
      });
    });
  });
});

describe('emitter.on()', () => {
  describe('emitter.on(eventName, listener)', () => {
    it(`should return a symbol (listener id) by default`, () => {
      const emitter = new Emitter();
      assert.equal(typeof emitter.on('test', () => {}), 'symbol');
    });

    it(`should add an event listener`, () => {
      const emitter = new Emitter();
      let counter = 0;

      emitter.on('test', () => void ++counter);

      emitter.emit('test');
      assert.equal(counter, 1);

      emitter.emit('test');
      assert.equal(counter, 2);
    });

    it('should allow duplicate listeners', () => {
      const emitter = new Emitter();
      let counter = 0;
      const listener = () => void ++counter;

      emitter.on('test', listener);
      emitter.on('test', listener);
      emitter.emit('test');
      assert.equal(counter, 2);
    });
  });

  describe('emitter.on(eventName, listener, listenerId)', () => {
    it(`should return the provided listener id`, () => {
      const emitter = new Emitter();
      assert.equal(
        emitter.on('test', () => {}, 'foo'),
        'foo',
      );
    });
  });
});

describe('emitter.once()', () => {
  describe('emitter.once(eventName, listener)', () => {
    it(`should return a symbol (listener id) by default`, () => {
      const emitter = new Emitter();
      assert.equal(typeof emitter.once('test', () => {}), 'symbol');
    });

    it(`should add an event listener that triggers only once`, () => {
      const emitter = new Emitter();
      let values: number[] = [];

      emitter.once('test', () => {
        values.push(1);
        emitter.once('test', () => {
          values.push(4);
        });
        emitter.emit('test');
      });

      emitter.once('test', () => {
        values.push(2);
        emitter.emit('test');
      });

      emitter.once('test', () => {
        values.push(3);
        emitter.emit('test');
      });

      emitter.emit('test');
      emitter.emit('test');

      assert.deepEqual(values, [1, 2, 3, 4]);
    });

    it('should allow duplicate listeners', () => {
      const emitter = new Emitter();
      let counter = 0;
      const listener = () => void ++counter;

      emitter.once('test', listener);
      emitter.once('test', listener);
      emitter.emit('test');
      assert.equal(counter, 2);
    });
  });

  describe('emitter.once(eventName, listener, listenerId)', () => {
    it(`should return the provided listener id`, () => {
      const emitter = new Emitter();
      assert.equal(
        emitter.once('test', () => {}, 'foo'),
        'foo',
      );
    });
  });
});

describe('emitter.off()', () => {
  describe('emitter.off()', () => {
    it(`should remove all events and their listeners from the emitter`, () => {
      const emitter = new Emitter();

      emitter.on('a', () => assert.fail());
      emitter.on('b', () => assert.fail());
      emitter.on('c', () => assert.fail());
      emitter.off();
      emitter.emit('a');
      emitter.emit('b');
      emitter.emit('c');

      assert.equal(1, 1);
    });
  });

  describe('emitter.off(eventName)', () => {
    it(`should remove all listeners of a specific event`, () => {
      const emitter = new Emitter();

      emitter.on('pass', () => {});
      emitter.on('fail', () => assert.fail());
      emitter.on('fail', () => assert.fail());
      emitter.off('fail');
      emitter.emit('fail');

      assert.equal(1, 1);
    });
  });

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
      assert.equal(value, 'ac');
    });
  });
});

describe('emitter.emit()', () => {
  describe('emitter.emit(eventName)', () => {
    it(`should emit the target event once without arguments`, () => {
      const emitter = new Emitter();
      let counter = 0;

      emitter.on('test', (...args) => {
        assert.equal(args.length, 0);
        ++counter;
      });

      emitter.emit('test');

      assert.equal(counter, 1);
    });

    it(`should execute the listeners synchronously in correct order with nested emits`, () => {
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

      assert.equal(value, 'acbcxc');
    });
  });

  describe('emitter.emit(eventName, ...args)', () => {
    it(`should emit the target event once with arguments`, () => {
      const emitter = new Emitter();
      const args = [null, undefined, true, false, 1, 'foo', Symbol(), {}, [], new Set(), new Map()];
      let counter = 0;

      emitter.on('test', (...receivedArgs) => {
        assert.deepEqual(receivedArgs, args);
        ++counter;
      });

      emitter.emit('test', ...args);

      assert.equal(counter, 1);
    });
  });
});

describe('emitter.listenerCount()', () => {
  describe('emitter.listenerCount(eventName)', () => {
    it(`should return the amount of listeners for the provided event`, () => {
      const emitter = new Emitter();

      emitter.on('a', () => {});
      emitter.on('b', () => {});
      emitter.on('b', () => {});
      emitter.on('c', () => {});
      emitter.on('c', () => {});
      emitter.on('c', () => {});

      assert.equal(emitter.listenerCount('a'), 1);
      assert.equal(emitter.listenerCount('b'), 2);
      assert.equal(emitter.listenerCount('c'), 3);
    });
  });

  describe('emitter.listenerCount()', () => {
    it(`should return the amount of all listeners in the emitter`, () => {
      const emitter = new Emitter();

      emitter.on('a', () => {});
      emitter.on('b', () => {});
      emitter.on('b', () => {});
      emitter.on('c', () => {});
      emitter.on('c', () => {});
      emitter.on('c', () => {});

      assert.equal(emitter.listenerCount(), 6);
    });
  });
});
