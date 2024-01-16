# Eventti

Tiny and fast multi-purpose event emitter for Node.js and browser wrapped in a simple API.

By default Eventti allows adding duplicate listeners to an event, but you can configure the Emitter to throw an error when a duplicate event listener is added. Additionally, Eventti assigns unique ids to all event listeners which allows you to granularly remove specific listeners (when there are duplicate listeners) and also update/replace existing listeners in the emitter.

Regarding performance, Eventti is fine-tuned to be as fast as possible with the feature set it provides. If there is room for optimization then we shall optimize ;) Please do open a ticket if you have performance optimization suggestions.

- The classic event emitter API with useful extras.
- Small footprint (under 1kb gzipped).
- Highly optimized and stable performance across browsers.
- Written in TypeScript with strict types.
- Extensively unit tested.
- Works in Node.js and modern browsers.
- No dependencies.
- MIT licensed.

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

In most modern browsers you can use the ES module directly via import maps.

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

For legacy browsers (and widest possible support) you can use the IIFE version of the library.

```html
<script src="https://cdn.jsdelivr.net/npm/eventti@4.0.0/dist/index.global.js"></script>
<script>
  const emitter = new eventti.Emitter();
</script>
```

## Usage

Basic usage follows the classic event emitter pattern, which is pretty much identical in most event emitters, nothing new here really.

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

// Define listeners.
const a = (msg) => console.log(msg);
const b = (...args) => console.log(...args);

// Add listeners to events.
emitter.on('a', a);
emitter.on('b', b);

// Emit events.
emitter.emit('a', 'foo');
// -> foo
emitter.emit('b', 'bar', 5000);
// -> bar 5000

// Remove listeners.
emitter.off('a', a);
emitter.off('b', b);
```

### Preventing duplicate listeners

Eventti's `Emitter` allows duplicate listeners by default (as do most event emitter implementations), but sometimes it's preferable to prevent duplicate event listeners.

```ts
import { Emitter } from 'eventti';

const emitter = new Emitter({ allowDuplicateListeners: false });
const listener = () => {};

emitter.on('a', listener);
emitter.on('a', listener); // throws an error
```

### Event listener ids

A useful extra feature of Eventti is that `.on()` and `.once()` methods return a unique listener id, which can be used to remove that specific listener. You can also provide the listener id manually via those methods and control how duplicate listener ids are handled.

```ts
import { Emitter, EmitterIdDedupeMode } from 'eventti';

const emitter = new Emitter();
const listener = () => {};

// When you add a listener a unique id is automatically created and returned,
// which you use to remove the specific listener.
const a1 = emitter.on('a', listener);
emitter.off('a', a1);

// You can also provide the id manually via a third argument.
const a2 = emitter.on('a', listener, 'foo');
a2 === 'foo'; // -> true
emitter.off('a', 'foo');

// The listener id is unique and there can only be one listener attached to
// an id at given time. So what should happen when you try to add the same
// listener id again? Well, it's up to you and Eventti allows you to choose from
// four different options what the behaviour should be.

// Case #1: When the idDedupeMode mode is set to "append" (which it is by
// default) the existing listener (matching the id) will be first completely
// removed and then the new listener will be appended to the listener queue.
const emitter1 = new Emitter({ idDedupeMode: EmitterIdDedupeMode.APPEND });
emitter1.on('a', () => console.log('foo 1'), 'foo');
emitter1.on('a', () => console.log('bar'), 'bar');
emitter1.on('a', () => console.log('foo 2'), 'foo');
emitter1.emit('a');
// -> bar
// -> foo 2

// Case #2: When the idDedupeMode mode is set to "update" the existing listener
// (matching the id) will be replaced with new listener while keeping the
// listener at the same index in the listener queue.
const emitter2 = new Emitter({ idDedupeMode: EmitterIdDedupeMode.UPDATE });
emitter2.on('a', () => console.log('foo 1'), 'foo');
emitter2.on('a', () => console.log('bar'), 'bar');
emitter2.on('a', () => console.log('foo 2'), 'foo');
emitter2.emit('a');
// -> foo 2
// -> bar

// Case #3: When the idDedupeMode mode is set to "ignore" the new listener is
// simply ignored.
const emitter3 = new Emitter({ idDedupeMode: EmitterIdDedupeMode.IGNORE });
emitter3.on('a', () => console.log('foo 1'), 'foo');
emitter3.on('a', () => console.log('bar'), 'bar');
emitter3.on('a', () => console.log('foo 2'), 'foo');
emitter3.emit('a');
// -> foo 1
// -> bar

// Case #4: When the idDedupeMode mode is set to "throw" an error is thrown.
const emitter4 = new Emitter({ idDedupeMode: EmitterIdDedupeMode.THROW });
emitter4.on('a', () => console.log('foo 1'), 'foo');
emitter4.on('a', () => console.log('bar'), 'bar');
emitter4.on('a', () => console.log('foo 2'), 'foo'); // throws an error

// Bonus tip: you can change the idDedupeMode mode at any point after
// instantiaiting the emitter. Just directly set the mode via emitter's
// idDedupeMode property.
const emitter5 = new Emitter();
emitter5.idDedupeMode = EmitterIdDedupeMode.THROW;
```

## Emitter API

`Emitter` is a class which's constructor accepts an optional configuration object with the following properties:

- **allowDuplicateListeners** &nbsp;&mdash;&nbsp; _boolean_
  - When set to `false` `.on()` or `.once()` methods will throw an error if a duplicate event listener is added.
  - Optional. Defaults to `true` if omitted.
- **idDedupeMode** &nbsp;&mdash;&nbsp; _"append" | "update" | "ignore" | "throw"_
  - Defines how a duplicate event listener id is handled.
    - `"append"`: the existing listener (of the id) is removed and the new listener is appended to the event's listener queue.
    - `"update"`: the existing listener (of the id) is replaced with the new listener without changing the index of the listener in the event's listener queue.
    - `"ignore"`: the new listener is silently ignored and not added to the event.
    - `"throw"`: as the name suggests an error will be thrown.
  - Optional. Defaults to `"append"` if omitted.

```ts
import { Emitter, EmitterIdDedupeMode } from 'eventti';

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
const emitterB = new Emitter<Events>({
  allowDuplicateListeners: false,
  idDedupeMode: EmitterIdDedupeMode.THROW,
});

// You can read the `allowDuplicateListeners` setting state, but it's not
// recommended to modify it after the emitter has been instantiated (it's a
// read-only property).
emitterB.allowDuplicateListeners; // -> false

// You can read and modify the `idDedupeMode` setting freely. It's okay to
// change it's value whenever you want.
emitterB.idDedupeMode; // -> "throw"
emitterB.idDedupeMode = EmitterIdDedupeMode.IGNORE;
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

- **eventName** &nbsp;&mdash;&nbsp; _string | number | symbol_
  - The event name specified as a string, number or symbol.
- **listener** &nbsp;&mdash;&nbsp; _Function_
  - A listener function that will be called when the event is emitted.
- **listenerId** &nbsp;&mdash;&nbsp; _string | number | symbol_ &nbsp;&mdash;&nbsp; _optional_
  - Optionally provide listener id manually.

**Returns** &nbsp;&mdash;&nbsp; _string | number | symbol_

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

- **eventName** &nbsp;&mdash;&nbsp; _string | number | symbol_
  - The event name specified as a string, number or symbol.
- **listener** &nbsp;&mdash;&nbsp; _Function_
  - A listener function that will be called when the event is emitted.
- **listenerId** &nbsp;&mdash;&nbsp; _string | number | symbol_ &nbsp;&mdash;&nbsp; _optional_
  - Optionally provide listener id manually.

**Returns** &nbsp;&mdash;&nbsp; _string | number | symbol_

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

- **eventName** &nbsp;&mdash;&nbsp; _string | number | symbol_ &nbsp;&mdash;&nbsp; _optional_
  - The event name specified as a string, number or symbol.
- **target** &nbsp;&mdash;&nbsp; _Function | string | number | symbol_ &nbsp;&mdash;&nbsp; _optional_
  - The event listener or listener id, which needs to be removed. If no _target_ is provided all listeners for the specified event will be removed.

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

- **eventName** &nbsp;&mdash;&nbsp; _string | number | symbol_
  - The event name specified as a string, number or symbol.
- **...args** &nbsp;&mdash;&nbsp; _any_ &nbsp;&mdash;&nbsp; _optional_
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

- **eventName** &nbsp;&mdash;&nbsp; _string / number / symbol_
  - The event name specified as a string, number or symbol.

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

Copyright © 2022, Niklas Rämö (inramo@gmail.com). Licensed under the MIT license.
