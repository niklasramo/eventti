# Eventti

A _predictable_ event emitter for pragmatists, written in TypeScript.

- 🔮 Predictable behaviour.
- 🎯 Hits the sweet spot between features, size and performance.
- 🎁 Small footprint (627 bytes minified and gzipped to be exact).
- ⚡ Highly optimized and stable performance across browsers.
- 🤖 Extensively tested.
- 🍭 No runtime dependencies, what you see is what you get.
- 💝 Free and open source, MIT Licensed.

## Why another event emitter?

Devs just _love_ to write their own event emitters, don't they? 🙋‍♂️ I've been guilty of writing a few myself, and I've also used many existing implementations of which there certainly is no shortage of.

However, there's always been one aspect that irks me in most of them, and that's the handling of duplicate event listeners. It's inconsistent. In some implementations duplicate listeners are not allowed (and they might be just silently ignored) while in others they are allowed, but then you can't remove a _specific_ listener anymore, because you don't know which one of the duplicates you're removing. Depending on the implementation it might be the first, last or all matching listeners.

```ts
// A very contrived example, but you get the point.
const ee = new YetAnotherEventEmitter();
let counter = 1;
const increment = () => void counter += 1;
const square = () => void counter *= counter;
ee.on('test', increment);
ee.on('test', square);
ee.on('test', increment);
ee.off('test', increment); // 🎲
ee.emit('test'); // counter === 1 or 2 or 4
```

To rectify this flaw in API design, Eventti follows in the footsteps of `setTimeout()`/`clearTimeout()` (and other similar Web APIs) by assigning and returning a unique id for each listener. No more guessing which listener you're removing.

```ts
import { Emitter } from 'eventti';
const ee = new Emitter();
let counter = 1;
const increment = () => void counter += 1;
const square = () => void counter *= counter;
const id1 = ee.on('test', increment);
const id2 = ee.on('test', square);
const id3 = ee.on('test', increment);
ee.off('test', id3); // ✅
ee.emit('test'); // counter === 4
```

Additionally, you can provide the listener id manually _and_ define strategy for handling duplicate ids. This is especially useful when you want to update an existing listener with a new one _without changing it's index in the listener queue_.

```ts
import { Emitter } from 'eventti';
const ee = new Emitter({ dedupe: 'update' });
ee.on('test', () => console.log('foo'), 'idA');
ee.on('test', () => console.log('bar'), 'idB');
// Update the listener for idA.
ee.on('test', () => console.log('baz'), 'idA');
ee.emit('test');
// -> baz
// -> bar
```

Finally, I hope this is the last event emitter I'll ever need to write 🤞.

## Performance

Regarding performance, Eventti is fine-tuned to be as fast as possible _with the feature set it provides_.

Listeners and their ids are stored in a `Map<id, listener>` instead of an array (the common convention), due to which Eventti loses a bit in performance when it comes to adding listeners. It's hard to beat a simple `array.push()`.

However, emitting speed is on par with the fastest of emitters due to an optimization Eventti applies: the listeners are cached in an array, which is invalidated any time a listener is removed. This way we don't have to _always_ clone the listeners on emit, most of the time we can go straight to looping the cached array.

Where things get interesting is when we start removing listeners. While most emitters need to loop an array of listeners to find the matching listener(s), Eventti can just delete the listener from the `Map` by the listener id. This is a huge performance boost when you have a lot of listeners.

In practice, Eventti and most other emitters are so fast that you don't need to worry about performance. But if you're interested in the numbers, we have some [benchmarks](./benchmarks/), which you can run with `npm run test-perf`.

## Getting started

The library is provided as an ECMAScript module (ESM) and a CommonJS module (CJS).

### Node

```
npm install eventti
```

```ts
import { Emitter } from 'eventti';
const emitter = new Emitter();
```

### Browser

```html
<script type="importmap">
  {
    "imports": {
      "eventti": "https://cdn.jsdelivr.net/npm/eventti@4.0.0/dist/index.js"
    }
  }
</script>
<script type="module">
  import { Emitter } from 'eventti';
  const emitter = new Emitter();
</script>
```

## Usage

```ts
import { Emitter } from 'eventti';

// Define emitter's events (if using TypeScript).
// Let the key be the event name and the value
// be the listener callback signature.
type Events = {
  a: (msg: string) => void;
  b: (str: string, num: number) => void;
};

// Create an emitter instance.
const emitter = new Emitter<Events>();

// Add listeners to events.
const idA = emitter.on('a', (msg) => console.log(msg));
const idB = emitter.on('b', (...args) => console.log(...args));

// Add a one-off listener to an event.
emitter.once('a', (msg) => console.log('once: ' + msg));

// Emit events.
emitter.emit('a', 'foo');
// -> foo
// -> once: foo
emitter.emit('a', 'foo');
// -> foo
emitter.emit('b', 'bar', 5000);
// -> bar 5000

// Count "a" event listeners.
emitter.listenerCount('a'); // -> 1

// Count all listeners.
emitter.listenerCount(); // -> 2

// Remove listeners.
emitter.off('a', idA);
emitter.off('b', idB);
```

## Listener ids and dedupe modes

The founding feature of Eventti is that every listener is assigned with an id. The id can be any value except `undefined`. By default Eventti uses `Symbol()` to create unique ids, but you can provide your own function if you want to use something else _and_ you can also provide the id manually via `.on()` and `.once()` methods.

Now the question is, what should happen when you try to add a listener with an id that already exists? Well, it's up to you and Eventti allows you to choose from four different options what the behaviour should be.

### dedupe: "add"

When `dedupe` is set to "add" (which it is by default) the existing listener (matching the id) will be first completely removed and then the new listener will be appended to the listener queue.

```ts
import { Emitter, EmitterDedupe } from 'eventti';

const emitter = new Emitter({ dedupe: EmitterDedupe.ADD });

emitter.on('a', () => console.log('foo 1'), 'foo');
emitter.on('a', () => console.log('bar'), 'bar');
emitter.on('a', () => console.log('foo 2'), 'foo');

emitter.emit('a');
// -> bar
// -> foo 2
```

### dedupe: "update"

When `dedupe` is set to "update" the existing listener (matching the id) will be replaced with new listener while keeping the listener at the same index in the listener queue.

```ts
import { Emitter, EmitterDedupe } from 'eventti';

const emitter = new Emitter({ dedupe: EmitterDedupe.UPDATE });

emitter.on('a', () => console.log('foo 1'), 'foo');
emitter.on('a', () => console.log('bar'), 'bar');
emitter.on('a', () => console.log('foo 2'), 'foo');

emitter.emit('a');
// -> foo 2
// -> bar
```

### dedupe: "ignore"

When `dedupe` is set to "ignore" the new listener is simply ignored.

```ts
import { Emitter, EmitterDedupe } from 'eventti';

const emitter = new Emitter({ dedupe: EmitterDedupe.IGNORE });

emitter.on('a', () => console.log('foo 1'), 'foo');
emitter.on('a', () => console.log('bar'), 'bar');
emitter.on('a', () => console.log('foo 2'), 'foo');

emitter.emit('a');
// -> foo 1
// -> bar
```

### dedupe: "throw"

When `dedupe` is set to "throw" an error is thrown.

```ts
import { Emitter, EmitterDedupe } from 'eventti';

const emitter = new Emitter({ dedupe: EmitterDedupe.THROW });

emitter.on('a', () => console.log('foo 1'), 'foo');
emitter.on('a', () => console.log('bar'), 'bar');
emitter.on('a', () => console.log('foo 2'), 'foo'); // throws an error
```

### Changing dedupe mode

You can change the `dedupe` mode at any point after instantiaiting the emitter. Just directly set the mode via the emitter's `dedupe` property.

```ts
import { Emitter, EmitterDedupe } from 'eventti';

const emitter = new Emitter();

emitter.dedupe = EmitterDedupe.THROW;
```

## Tips and tricks

### Mimicking the _classic_ event emitter API

Eventti's API is a bit different from most other event emitters, but you can easily mimic the _classic_ API (where you remove listeners based on the callback) by using the `getId` option. This way you can use the listener callback as the listener id by default and remove listeners based on the callback. But do note that this way duplicate listeners can't be added, which may or may not be what you want.

```ts
import { Emitter } from 'eventti';

const emitter = new Emitter({
  // Decide what to do with duplicate listeners by default.
  dedupe: 'throw',
  // Use the listener callback as the listener id.
  getId: (listener) => listener,
});

const listener = () => {};

// Now the listener callback is used as
// the listener id automatically...
const idA = emitter.on('a', listener);
console.log(idA === listener); // -> true

// ...and you can remove the listener
// with the listener callback...
emitter.off('a', listener);

// ...and duplicate listeners can't be added.
emitter.on('a', listener);
emitter.on('a', listener); // throws an error
```

### Ergonomic unbinding

Eventti's API is designed to be explicit and predictable, but sometimes you might want a bit more ergonomic API by returning a function from the `.on()` and `.once()` methods which you can use to unbind the listener.

Here's a recipe for that:

```ts
import { Emitter, Events, EventListenerId, EmitterOptions } from 'eventti';

class ErgonomicEmitter<T extends Events> extends Emitter<T> {
  constructor(options?: EmitterOptions) {
    super(options);
  }

  on<EventName extends keyof T>(
    eventName: EventName,
    listener: T[EventName],
    listenerId?: EventListenerId,
  ): EventListenerId {
    const id = super.on(eventName, listener, listenerId);
    return () => this.off(eventName, id);
  }

  once<EventName extends keyof T>(
    eventName: EventName,
    listener: T[EventName],
    listenerId?: EventListenerId,
  ): EventListenerId {
    const id = super.once(eventName, listener, listenerId);
    return () => this.off(eventName, id);
  }
}

const emitter = new ErgonomicEmitter();
const unbind = emitter.on('a', () => console.log('foo'));
unbind(); // removes the listener
```

Do note that this breaks the API contract as now you can't use the return value of `.on()` and `.once()` methods anymore to remove the listeners with `.off` method. But if you're okay with that, this is a nice way to make the API more ergonomic.

### Building a ticker

Eventti is a great fit for building a ticker, which is a common use case for event emitters. Here's a simple example of how you could build a `requestAnimationFrame` ticker.

```ts
import { Emitter, EmitterOptions, EventListenerId } from 'eventti';

class Ticker {
  private tickId: number | null;
  private emitter: Emitter<{ tick: (time: number) => void }>;

  constructor(options?: EmitterOptions) {
    this.tickId = null;
    this.emitter = new Emitter(options);
  }

  on(listener: (time: number) => void, listenerId?: EventListenerId): EventListenerId {
    return this.emitter.on('tick', listener, listenerId);
  }

  once(listener: (time: number) => void, listenerId?: EventListenerId): EventListenerId {
    return this.emitter.once('tick', listener, listenerId);
  }

  off(listenerId?: EventListenerId): void {
    this.emitter.off('tick', listenerId);
  }

  start(): void {
    if (this.tickId !== null) return;
    const tick = (time: number) => {
      this.tickId = requestAnimationFrame(tick);
      if (time) this.emitter.emit('tick', time);
    };
    tick(0);
  }

  stop(): void {
    if (this.tickId === null) return;
    cancelAnimationFrame(this.tickId);
    this.tickId = null;
  }
}

const ticker = new Ticker();

const idA = ticker.on(() => console.log('tick a'));
const idB = ticker.on(() => console.log('tick b'));

ticker.off(idB);

ticker.start();
// -> tick a
// -> tick a
// -> tick a
// ...

ticker.stop();
```

If you want a more advanced and battle-tested ticker you might want to check out [tikki](https://github.com/niklasramo/tikki), a ticker implementation built on top of Eventti.

## Emitter API

- [Constructor](#constructor)
- [on( eventName, listener, [ listenerId ] )](#emitteron)
- [once( eventName, listener, [ listenerId ] )](#emitteronce)
- [off( [ eventName ], [ listenerId ] )](#emitteroff)
- [emit( eventName, [ ...args ] )](#emitteremit)
- [listenerCount( [ eventName ] )](#emitterlistenercount)
- [Types](#types)

### Constructor

`Emitter` is a class which's constructor accepts an optional [`EmitterOptions`](#emitteroptions) object with the following properties:

- **dedupe**
  - Defines how a duplicate event listener id is handled:
    - `"add"`: the existing listener (of the id) is removed and the new listener is appended to the event's listener queue.
    - `"update"`: the existing listener (of the id) is replaced with the new listener without changing the index of the listener in the event's listener queue.
    - `"ignore"`: the new listener is silently ignored and not added to the event.
    - `"throw"`: as the name suggests an error will be thrown.
  - Accepts: [`EmitterDedupe`](#emitterdedupe).
  - Optional, defaults to `"add"` if omitted.
- **getId**
  - A function which is used to get the listener id for a listener callback. By default Eventti uses `Symbol()` to create unique ids, but you can provide your own function if you want to use something else. Receives the listener callback as the first (and only) argument.
  - Accepts: `(listener: EventListener) => EventListenerId`.
  - Optional, defaults to `() => Symbol()` if omitted.

```ts
import { Emitter, EmitterDedupe } from 'eventti';

// Define emitter's events (if using TypeScript).
// Let the key be the event name and the value
// be the listener callback signature.
type Events = {
  a: (msg: string) => void;
  b: (str: string, num: number) => void;
};

// Create emitter instance.
const emitterA = new Emitter<Events>();

// Create emitter instance with options.
let _id = Number.MIN_SAFE_INTEGER;
const emitterB = new Emitter<Events>({
  dedupe: EmitterDedupe.THROW,
  getId: () => ++_id,
});

// You can read and modify the `dedupe` setting
// freely. It's okay to change it's value whenever
// you want.
emitterB.dedupe; // -> "throw"
emitterB.dedupe = EmitterDedupe.IGNORE;

// You can read and modify the `getId` setting freely.
// It's okay to change it's value whenever you want.
emitterB.getId = () => Symbol();
```

### emitter.on()

Add a listener to an event.

**Syntax**

```
emitter.on( eventName, listener, [ listenerId ] )
```

**Parameters**

1. **eventName**
   - The name of the event you want to add a listener to.
   - Accepts: [`EventName`](#eventname).
2. **listener**
   - A listener function that will be called when the event is emitted.
   - Accepts: [`EventListener`](#eventlistener).
3. **listenerId**
   - The id for the listener. If not provided, the id will be generated by the `emitter.getId` method.
   - Accepts: [`EventListenerId`](#eventlistenerid).
   - _optional_

**Returns**

A [listener id](#eventlistenerid), which can be used to remove this specific listener. Unless manually provided via arguments this will be whatever the `emitter.getId` method spits out, and by default it spits out symbols which are guaranteed to be always unique.

**Examples**

```ts
import { Emitter } from 'eventti';

const emitter = new Emitter();

const a = () => console.log('a');
const b = () => console.log('b');

// Bind a and b listeners to "test" event. Here we don't provide the third
// argument (listener id) so it is created automatically and returned by the
// .on() method.
const id1 = emitter.on('test', a);
const id2 = emitter.on('test', b);

// Here we bind a and b listeners agains to "test" event, but we provide the
// listener id manually.
const id3 = emitter.on('test', a, 'foo');
const id4 = emitter.on('test', b, 'bar');
id3 === 'foo'; // => true
id4 === 'bar'; // => true

emitter.emit('test');
// a
// b
// a
// b

emitter.off('test', id2);
emitter.emit('test');
// a
// a
// b

emitter.off('test', a);
emitter.emit('test');
// b
```

### emitter.once()

Add a one-off listener to an event.

**Syntax**

```
emitter.once( eventName, listener, [ listenerId ] )
```

**Parameters**

1. **eventName**
   - The name of the event you want to add a listener to.
   - Accepts: [`EventName`](#eventname).
2. **listener**
   - A listener function that will be called when the event is emitted.
   - Accepts: [`EventListener`](#eventlistener).
3. **listenerId**
   - The id for the listener. If not provided, the id will be generated by the `emitter.getId` function.
   - Accepts: [`EventListenerId`](#eventlistenerid).
   - _optional_

**Returns**

A [listener id](#eventlistenerid), which can be used to remove this specific listener. Unless manually provided via arguments this will be whatever the `emitter.getId` method spits out, and by default it spits out symbols which are guaranteed to be always unique.

**Examples**

```ts
import { Emitter } from 'eventti';

const emitter = new Emitter();
const a = () => console.log('a');
const b = () => console.log('b');

emitter.on('test', a);
emitter.once('test', b);

emitter.emit('test');
// a
// b

emitter.emit('test');
// a
```

### emitter.off()

Remove an event listener or multiple event listeners. If no _listenerId_ is provided all listeners for the specified event will be removed. If no _eventName_ is provided all listeners from the emitter will be removed.

**Syntax**

```
emitter.off( [ eventName ], [ listenerId ] );
```

**Parameters**

1. **eventName**
   - The name of the event you want to remove listeners from.
   - Accepts: [`EventName`](#eventname).
   - _optional_
2. **listenerId**
   - The id of the listener you want to remove.
   - Accepts: [`EventListenerId`](#eventlistenerid).
   - _optional_

**Examples**

```ts
import { Emitter } from 'eventti';

const emitter = new Emitter();

const a = () => console.log('a');
const b = () => console.log('b');

const id1 = emitter.on('test', a);
const id2 = emitter.on('test', b);
const id3 = emitter.on('test', a);
const id4 = emitter.on('test', b);

// Remove specific listener by id.
emitter.off('test', id2);

// Remove all listeners from an event.
emitter.off('test');

// Remove all listeners from the emitter.
emitter.off();
```

### emitter.emit()

Emit events.

**Syntax**

```
emitter.emit( eventName, [ ...args ] )
```

**Parameters**

1. **eventName**
   - The name of the event you want to emit.
   - Accepts: [`EventName`](#eventname).
2. **...args**
   - The arguments which will be provided to the listeners when called.
   - Accepts: `any`.
   - Optional.

**Examples**

```ts
import { Emitter } from 'eventti';

const emitter = new Emitter();

emitter.on('test', (...args) => console.log(args.join('-')));

// Provide arguments to the event's listeners.
emitter.emit('test', 1, 2, 3, 'a', 'b', 'c');
// '1-2-3-a-b-c'
```

### emitter.listenerCount()

Returns the listener count for an event if _eventName_ is provided. Otherwise returns the listener count for the whole emitter.

**Syntax**

```
emitter.listenerCount( [ eventName ] )
```

**Parameters**

1. **eventName**
   - The name of the event you want to get the listener count for.
   - Accepts: [`EventName`](#eventname).
   - Optional.

**Examples**

```ts
import { Emitter } from 'eventti';

const emitter = new Emitter();

emitter.on('a', () => {});
emitter.on('b', () => {});
emitter.on('b', () => {});
emitter.on('c', () => {});
emitter.on('c', () => {});
emitter.on('c', () => {});

emitter.listenerCount('a'); // 1
emitter.listenerCount('b'); // 2
emitter.listenerCount('c'); // 3
emitter.listenerCount(); // 6
```

### Types

Here's a list of all the types that you can import from `eventti`.

```ts
import {
  EventName,
  EventListener,
  EventListenerId,
  Events,
  EmitterDedupe,
  EmitterOptions,
} from 'eventti';
```

#### EventName

```ts
type EventName = string | number | symbol;
```

#### EventListener

```ts
type EventListener = (...data: any) => any;
```

#### Events

```ts
type Events = Record<string | number | symbol, EventListener>;
```

#### EventListenerId

```ts
type EventListenerId = null | string | number | symbol | bigint | Function | Object;
```

#### EmitterDedupe

```ts
type EmitterDedupe = 'add' | 'update' | 'ignore' | 'throw';
```

#### EmitterOptions

```ts
type EmitterOptions = {
  dedupe?: EmitterDedupe;
  getId?: (listener: EventListener) => EventListenerId;
};
```

## License

Copyright © 2022-2024, Niklas Rämö (inramo@gmail.com). Licensed under the [MIT license](./LICENSE.md).
