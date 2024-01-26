// Copied the idea for this test suite from the awesome mitt library:
// https://github.com/developit/mitt/blob/main/test/test-types-compilation.ts
// All credit goes there!

import { Emitter } from '../../src/index.js';

type Events = {
  a: () => void;
  b: (a: string) => void;
  c: (a: number, b: string, c?: boolean) => void;
};

const emitter = new Emitter<Events>();
const a = () => {};
const b = (_x: string) => {};
const c = (_x: number, _y: string) => {};

/*
 * Check that 'on' args are inferred correctly
 */
{
  emitter.on('a', a);
  emitter.on('b', a);
  emitter.on('b', b);
  emitter.on('c', c);

  // @ts-expect-error
  emitter.on('a', b);

  // @ts-expect-error
  emitter.on('a', c);

  // @ts-expect-error
  emitter.on('b', c);

  // @ts-expect-error
  emitter.on('c', b);
}

/*
 * Check that listener id is inferred correctly
 */
{
  emitter.on('a', a, 1);
  emitter.on('a', a, 'a');
  emitter.on('a', a, Symbol());
  emitter.on('a', a, true);
  emitter.on('a', a, false);
  emitter.on('a', a, []);
  emitter.on('a', a, {});
  emitter.on('a', a, () => {});

  // @ts-expect-error
  emitter.emit('a', a, undefined);

  // @ts-expect-error
  emitter.emit('a', a, null);
}

/*
 * Check that 'off' args are inferred correctly
 */
{
  emitter.off('a', a);
  emitter.off('b', a);
  emitter.off('b', b);
  emitter.off('c', c);

  emitter.off('a', Symbol());
  emitter.off('b', Symbol());
  emitter.off('c', Symbol());

  emitter.off('a');
  emitter.off('b');
  emitter.off('c');

  emitter.off();
}

/*
 * Check that 'emit' args are inferred correctly
 */
{
  emitter.emit('a');
  emitter.emit('b', 'foo');
  emitter.emit('c', 1, 'foo');
  emitter.emit('c', 1, 'foo', true);

  // @ts-expect-error
  emitter.emit('a', 'NOT VALID');

  // @ts-expect-error
  emitter.emit('b');

  // @ts-expect-error
  emitter.emit('b', 1);

  // @ts-expect-error
  emitter.emit('c');

  // @ts-expect-error
  emitter.emit('c', 'foo');

  // @ts-expect-error
  emitter.emit('c', 1, 2);
}
