import test from 'ava';
import { Emitter } from '../dist/eventti.js';

test(`emitter.on(event, listener) should return a unique reference that can be used to remove the listener`, (t) => {
  const emitter = new Emitter();
  let counter = 0;
  const listenerId = emitter.on('test', () => {
    ++counter;
  });

  emitter.off('test', listenerId);
  emitter.emit('test');

  t.is(counter, 0);
});

test(`emitter.once(event, listener) should only trigger once`, (t) => {
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

  t.is(counter, 1);
});

test(`emitter.once(event, listener) should return an unique reference that can be used to remove the listener`, (t) => {
  const emitter = new Emitter();
  let counter = 0;
  const listenerId = emitter.once('test', () => {
    ++counter;
  });

  emitter.off('test', listenerId);
  emitter.emit('test');

  t.is(counter, 0);
});

test(`emitter.off(event, listenerId) should remove listener by reference`, (t) => {
  const emitter = new Emitter();
  let value = '';
  const a = emitter.on('test', () => {
    value += 'a';
  });
  const b = emitter.on('test', () => {
    value += 'b';
  });
  const c = emitter.on('test', () => {
    value += 'c';
  });

  emitter.off('test', b);
  emitter.emit('test');
  t.is(value, 'ac');
});

test(`emitter.off(event, listener) should remove listeners by function`, (t) => {
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

  t.is(value, 'ac');
});

test(`emitter.off(event) should remove listeners by event name`, (t) => {
  const emitter = new Emitter();

  emitter.on('pass', () => {});
  emitter.on('fail', () => t.fail());
  emitter.on('fail', () => t.fail());
  emitter.off('fail');
  emitter.emit('fail');

  t.pass();
});

test(`emitter.off() should remove all listeners`, (t) => {
  const emitter = new Emitter();

  emitter.on('a', () => t.fail());
  emitter.on('b', () => t.fail());
  emitter.on('c', () => t.fail());
  emitter.off();
  emitter.emit('a');
  emitter.emit('b');
  emitter.emit('c');

  t.pass();
});

test(`emitter.emit(event) should emit the target event once`, (t) => {
  const emitter = new Emitter();
  let counter = 0;

  emitter.on('TEST', () => {
    t.fail();
  });
  emitter.on('test', () => {
    ++counter;
  });
  emitter.emit('test');

  t.is(counter, 1);
});

test(`emitter.emit(event, ...args) should pass the arguments to the listeners`, (t) => {
  const emitter = new Emitter();
  const args = [null, undefined, true, false, 1, 'foo', Symbol(), {}, [], new Set(), new Map()];

  emitter.on('test', (...receivedArgs) => {
    t.deepEqual(receivedArgs, args);
  });
  emitter.emit('test', ...args);
});

test(`emitter.emit(event) should only execute the listeners synchronously in correct order`, (t) => {
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
  const c = emitter.on('test', () => {
    value += 'c';
  });

  emitter.emit('test');

  t.is(value, 'acbcxc');
});

test(`emitter.listenerCount(event) should return the amount of listeners for the provided event`, (t) => {
  const emitter = new Emitter();

  emitter.on('a', () => {});
  emitter.on('b', () => {});
  emitter.on('b', () => {});
  emitter.on('c', () => {});
  emitter.on('c', () => {});
  emitter.on('c', () => {});

  t.is(emitter.listenerCount('a'), 1);
  t.is(emitter.listenerCount('b'), 2);
  t.is(emitter.listenerCount('c'), 3);
});

test(`emitter.listenerCount() should return the amount of all listeners in the emitter`, (t) => {
  const emitter = new Emitter();

  emitter.on('a', () => {});
  emitter.on('b', () => {});
  emitter.on('b', () => {});
  emitter.on('c', () => {});
  emitter.on('c', () => {});
  emitter.on('c', () => {});

  t.is(emitter.listenerCount(), 6);
});

test('emitter.on(event, listener) should allow duplicate listeners', (t) => {
  const emitter = new Emitter();
  let counter = 0;
  const listener = () => {
    ++counter;
  };

  emitter.on('test', listener);
  emitter.on('test', listener);
  emitter.emit('test');

  t.is(counter, 2);
});

test('emitter.once(event, listener) should allow duplicate listeners', (t) => {
  const emitter = new Emitter();
  let counter = 0;
  const listener = () => {
    ++counter;
  };

  emitter.once('test', listener);
  emitter.once('test', listener);
  emitter.emit('test');

  t.is(counter, 2);
});

test('emitter.on(event, listener) should return a symbol', (t) => {
  const emitter = new Emitter();
  t.is(typeof emitter.on('test', () => {}), 'symbol');
});

test('emitter.once(event, listener) should return a symbol', (t) => {
  const emitter = new Emitter();
  t.is(typeof emitter.on('test', () => {}), 'symbol');
});

test('emitter.off(event, listener) should remove all listeners by function', (t) => {
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
  const listenerD = () => {
    value += 'd';
  };

  emitter.on('test', listenerA);
  emitter.on('test', listenerB);
  emitter.on('test', listenerC);
  emitter.on('test', listenerD);
  emitter.on('test', listenerB);
  emitter.on('test', listenerC);
  emitter.off('test', listenerB);
  emitter.emit('test');

  t.is(value, 'acdc');
});
