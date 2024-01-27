# Eventti

A _predictable_ event emitter for pragmatists, written in TypeScript.

- 🔮 Predictable behaviour.
- 🎯 Hits the sweet spot between features, size and performance.
- 🎁 Small footprint (well under 1kB gzipped).
- ⚡ Highly optimized and stable performance across browsers.
- 🤖 Extensively tested.
- 🍭 No runtime dependencies, what you see is what you get.
- 💝 Free and open source, MIT Licensed.

## Why another event emitter?

Devs just _love_ to write their own event emitters, don't they? 🙋‍♂️ I've been guilty of writing a few myself, and I've also used many existing implementations of which there certainly is no shortage of.

However, there's always been one aspect that irks me in most of them, and that's the handling of duplicate event listeners. It's inconsistent. In some implementations duplicate listeners are not allowed (and they might be just silently ignored) while in others they are allowed, but then you can't remove a _specific_ listener anymore, because you don't know which one of the duplicates you're removing. Depending on the implementation it might be the first matching listener or all of them. Frustrating.

```ts
// A very contrived example, but you get the point.
const ee = new YetAnotherEventEmitter();
let counter = 10;
const increment = () => void counter += 10;
const square = () => void counter *= counter;
ee.on('test', increment);
ee.on('test', square);
ee.on('test', increment);
ee.off('test', increment); // 🎲
ee.emit('test'); // counter === ???
```

To rectify this flaw in API design, Eventti follows in the footsteps of `setTimeout()`/`clearTimeout()` (and other similar Web APIs) by assigning and returning a unique id for each listener. No more guessing which listener you're removing.

```ts
const eventti = new Eventti();
let counter = 10;
const increment = () => void counter += 10;
const square = () => void counter *= counter;
const id1 = eventti.on('test', increment);
const id2 = eventti.on('test', square);
const id3 = eventti.on('test', increment);
eventti.off('test', id3); // ✅
eventti.emit('test'); // counter === 400
```

Additionally, you can provide the listener id manually _and_ define strategy for handling duplicate ids. This is especially useful when you want to update an existing listener with a new one, but keep the listener at the same index in the listener queue.

```ts
const eventti = new Emitter({ dedupeMode: 'update' });
eventti.on('test', () => console.log('foo'), 'idA');
eventti.on('test', () => console.log('bar'), 'idB');
// Update the listener for idA.
eventti.on('test', () => console.log('baz'), 'idA');
eventti.emit('test');
// -> baz
// -> bar
```

Finally, I hope this is the last event emitter I'll ever need to write 🤞.

## Performance

Regarding performance, Eventti is fine-tuned to be as fast as possible _with the feature set it provides_.

Listeners and their ids are stored in a `Map<id, listener>` instead of an array (the common convention), due to which Eventti loses a bit in performance when it comes to adding listeners. It's hard to beat a simple `array.push()`.

However, emitting speed is on par with the fastest of emitters due to an optimization Eventti applies: the listeners are cached in an array, which is invalidated any time a listener is removed. This way we don't have to _always_ clone the listeners on emit, most of the time we can go straight to looping the cached array.

Where things get interesting is when we start removing listeners. While most emitters need to loop through an array of listeners to find the matching listener(s), Eventti can just delete the listener from the `Map` by the listener id. This is a huge performance boost when you have a lot of listeners.

In practice, Eventti and most other emitters are so fast that you don't need to worry about performance. But if you're interested in the numbers, we have some [benchmarks](./benchmarks/), which you can run with `npm run test-perf`.

## Getting started

The library is provided as an ECMAScript module (ESM), a CommonJS module (CJS) and as an IIFE bundle.

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

// Emit events.
emitter.emit('a', 'foo');
// -> foo
emitter.emit('b', 'bar', 5000);
// -> bar 5000

// Remove listeners.
emitter.off('a', idA);
emitter.off('b', idB);
```

### Listener ids and dedupe mode

The founding feature of Eventti is that every listener is assigned with a unique id. The id can be any value except `null` or `undefined`. By default Eventti uses `Symbol()` to create unique ids, but you can provide your own function if you want to use something else _and_ you can also provide the id manually via `.on()` and `.once()` methods.

Now the question is, what should happen when you try to add a listener with an id that already exists? Well, it's up to you and Eventti allows you to choose from four different options what the behaviour should be.

#### dedupeMode: "add"

When the dedupeMode mode is set to "add" (which it is by default) the existing listener (matching the id) will be first completely removed and then the new listener will be appended to the listener queue.

```ts
import { Emitter } from 'eventti';

const emitter = new Emitter({ dedupeMode: 'add' });

emitter.on('a', () => console.log('foo 1'), 'foo');
emitter.on('a', () => console.log('bar'), 'bar');
emitter.on('a', () => console.log('foo 2'), 'foo');

emitter.emit('a');
// -> bar
// -> foo 2
```

#### dedupeMode: "update"

When the dedupeMode mode is set to "update" the existing listener (matching the id) will be replaced with new listener while keeping the listener at the same index in the listener queue.

```ts
import { Emitter } from 'eventti';

const emitter = new Emitter({ dedupeMode: 'update' });

emitter.on('a', () => console.log('foo 1'), 'foo');
emitter.on('a', () => console.log('bar'), 'bar');
emitter.on('a', () => console.log('foo 2'), 'foo');

emitter.emit('a');
// -> foo 2
// -> bar
```

#### dedupeMode: "ignore"

When the dedupeMode mode is set to "ignore" the new listener is simply ignored.

```ts
import { Emitter } from 'eventti';

const emitter = new Emitter({ dedupeMode: 'ignore' });

emitter.on('a', () => console.log('foo 1'), 'foo');
emitter.on('a', () => console.log('bar'), 'bar');
emitter.on('a', () => console.log('foo 2'), 'foo');

emitter.emit('a');
// -> foo 1
// -> bar
```

#### dedupeMode: "throw"

When the dedupeMode mode is set to "throw" an error is thrown.

```ts
import { Emitter } from 'eventti';

const emitter = new Emitter({ dedupeMode: 'throw' });

emitter.on('a', () => console.log('foo 1'), 'foo');
emitter.on('a', () => console.log('bar'), 'bar');
emitter.on('a', () => console.log('foo 2'), 'foo'); // throws an error
```

#### Changing dedupe mode

You can change the `dedupeMode` mode at any point after instantiaiting the emitter. Just directly set the mode via emitter's `dedupeMode` property.

```ts
import { Emitter, EmitterDedupeMode } from 'eventti';

const emitter = new Emitter();

emitter.dedupeMode = EmitterDedupeMode.THROW;
```

### Preventing duplicate listeners

Eventti's `Emitter` allows duplicate listeners by default (as do most event emitter implementations), but you can configure it to use the listener callback as the listener id by default and then decide (with `dedupeMode`) what you want to happen when a duplicate listener is detected.

```ts
import { Emitter } from 'eventti';

const emitter = new Emitter({
  dedupeMode: 'throw',
  createId: (listener) => listener,
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

## Emitter API

`Emitter` is a class which's constructor accepts an optional configuration object with the following properties:

- **dedupeMode** &nbsp;&mdash;&nbsp; `"add" | "update" | "ignore" | "throw"`∫
  - Defines how a duplicate event listener id is handled.
    - `"add"`: the existing listener (of the id) is removed and the new listener is appended to the event's listener queue.
    - `"update"`: the existing listener (of the id) is replaced with the new listener without changing the index of the listener in the event's listener queue.
    - `"ignore"`: the new listener is silently ignored and not added to the event.
    - `"throw"`: as the name suggests an error will be thrown.
  - Optional. Defaults to `"add"` if omitted.
- **createId** &nbsp;&mdash;&nbsp; `(listener) => string | number | symbol | bigint | Function | Object`
  - A function which is used to create listener ids. By default Eventti uses `Symbol()` to create unique ids, but you can provide your own function if you want to use something else. Receives the listener callback as the first (and only) argument.
  - Optional. Defaults to `() => Symbol()` if omitted.

```ts
import { Emitter, EmitterDedupeMode } from 'eventti';

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
let _id = 0;
const emitterB = new Emitter<Events>({
  dedupeMode: EmitterDedupeMode.THROW,
  createId: () => ++_id,
});

// You can read and modify the `dedupeMode` setting
// freely. It's okay to change it's value whenever
// you want.
emitterB.dedupeMode; // -> "throw"
emitterB.dedupeMode = EmitterDedupeMode.IGNORE;

// You can read and modify the `createId` setting freely.
// It's okay to change it's value whenever you want.
emitterB.createId = () => Symbol();
```

**Methods**

- [on( eventName, listener, [listenerId] )](#emitter-on)
- [once( eventName, listener, [listenerId] )](#emitter-once)
- [off( [eventName], [target] )](#emitter-off)
- [emit( eventName, [...args] )](#emitter-emit)
- [listenerCount( [eventName] )](#emitter-listenerCount)

### emitter.on()

Add a listener to an event.

**Syntax**

```
emitter.on( eventName, listener, [ listenerId ] )
```

**Arguments**

- **eventName** &nbsp;&mdash;&nbsp; `string | number | symbol`
- **listener** &nbsp;&mdash;&nbsp; `(...data: any) => any`
  - A listener function that will be called when the event is emitted.
- **listenerId** &nbsp;&mdash;&nbsp; `string | number | symbol | bigint | Function | Object` &nbsp;&mdash;&nbsp; _optional_
  - Optionally you can provide the listener id manually.

**Returns** &nbsp;&mdash;&nbsp; `string | number | symbol`

A listener id, which can be used to remove this specific listener. By default this will always be a symbol unless manually provided.

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
// listener id manually (can be a string, a number or a symbol).
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

**Arguments**

- **eventName** &nbsp;&mdash;&nbsp; `string | number | symbol`
- **listener** &nbsp;&mdash;&nbsp; `(...data: any) => any`
  - A listener function that will be called when the event is emitted.
- **listenerId** &nbsp;&mdash;&nbsp; `string | number | symbol | bigint | Function | Object` &nbsp;&mdash;&nbsp; _optional_
  - Optionally you can provide the listener id manually.

**Returns** &nbsp;&mdash;&nbsp; `string | number | symbol`

A listener id, which can be used to remove this specific listener. By default this will always be a symbol unless manually provided.

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

Remove an event listener or multiple event listeners. If no _target_ is provided all listeners for the specified event will be removed. If no _eventName_ is provided all listeners from the emitter will be removed.

**Syntax**

```
emitter.off( [ eventName ], [ target ] );
```

**Arguments**

- **eventName** &nbsp;&mdash;&nbsp; `string | number | symbol` &nbsp;&mdash;&nbsp; _optional_
- **listenerId** &nbsp;&mdash;&nbsp; `string | number | symbol | bigint | Function | Object` &nbsp;&mdash;&nbsp; _optional_

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

// Remove all instances of a specific listener function.
emitter.off('test', a);

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

**Arguments**

- **eventName** &nbsp;&mdash;&nbsp; `string | number | symbol`
- **...args** &nbsp;&mdash;&nbsp; `any` &nbsp;&mdash;&nbsp; _optional_
  - The arguments which will be provided to the listeners when called.

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

**Arguments**

- **eventName** &nbsp;&mdash;&nbsp; `string / number / symbol`

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

## License

Copyright © 2022-2024, Niklas Rämö (inramo@gmail.com). Licensed under the [MIT license](./LICENSE.md).
