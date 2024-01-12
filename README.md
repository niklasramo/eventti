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

<h2><a id="install" href="#install" aria-hidden="true">#</a> Install</h2>

Node

```bash
$ npm install eventti
```

Browser

```html
<script src="https://cdn.jsdelivr.net/npm/eventti@3.0.0/dist/eventti.umd.js"></script>
```

Access the emitter via `window.eventti.Emitter` in browser context.

<h2><a id="usage" href="#usage" aria-hidden="true">#</a> Usage</h2>

Basic usage is pretty much identical to most other event emitters, nothing new here really.

```typescript
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

<h3><a id="usage-duplicate-listeners" href="#usage-duplicate-listeners" aria-hidden="true">#</a> Preventing duplicate listeners</h3>

Eventti's `Emitter` allows duplicate listeners by default (as do most event emitter implementations), but sometimes it's preferable to prevent duplicate event listeners.

```typescript
import { Emitter } from 'eventti';

const emitter = new Emitter({ allowDuplicateListener: false });
const listener = () => {};

emitter.on('a', listener);
emitter.on('a', listener); // throws an error
```

<h3><a id="usage-listener-id" href="#usage-listener-id" aria-hidden="true">#</a> Event listener ids</h3>

A useful extra feature of Eventti is that `.on()` and `.once()` methods return a unique listener id, which can be used to remove that specific listener. You can also provide the listener id manually via those methods and control how duplicate listener ids are handled.

```typescript
import { Emitter } from 'eventti';

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

// Case #1: When the idDedupeMode mode is set to "replace" (which it is by
// default) the existing listener will be first completely removed and then the
// new listener will be added at the end of the listener queue.
const emitter1 = new Emitter({ idDedupeMode: 'replace' });
emitter1.on('a', () => console.log('foo 1'), 'foo');
emitter1.on('a', () => console.log('bar'), 'bar');
emitter1.on('a', () => console.log('foo 2'), 'foo');
emitter1.emit('a');
// -> bar
// -> foo 2

// Case #2: When the idDedupeMode mode is set to "update" the existing listener
// will be updated by the new listener while keeping the listener at the same
// index in the listener queue.
const emitter2 = new Emitter({ idDedupeMode: 'update' });
emitter2.on('a', () => console.log('foo 1'), 'foo');
emitter2.on('a', () => console.log('bar'), 'bar');
emitter2.on('a', () => console.log('foo 2'), 'foo');
emitter2.emit('a');
// -> foo 2
// -> bar

// Case #3: When the idDedupeMode mode is set to "ignore" the new listener is
// simply ignored.
const emitter3 = new Emitter({ idDedupeMode: 'ignore' });
emitter3.on('a', () => console.log('foo 1'), 'foo');
emitter3.on('a', () => console.log('bar'), 'bar');
emitter3.on('a', () => console.log('foo 2'), 'foo');
emitter3.emit('a');
// -> foo 1
// -> bar

// Case #4: When the idDedupeMode mode is set to "throw" an error is thrown.
const emitter4 = new Emitter({ idDedupeMode: 'throw' });
emitter4.on('a', () => console.log('foo 1'), 'foo');
emitter4.on('a', () => console.log('bar'), 'bar');
emitter4.on('a', () => console.log('foo 2'), 'foo'); // throws an error

// Bonus tip: you can change the idDedupeMode mode at any point after
// instantiaiting the emitter. Just directly set the mode via emitter's
// idDedupeMode property.
const emitter5 = new Emitter();
emitter5.idDedupeMode = 'throw';
```

<h2><a id="api" href="#api" aria-hidden="true">#</a> Emitter API</h2>

`Emitter` is a class which's constructor accepts an optional configuration object with the following properties:

- **allowDuplicateListeners** &nbsp;&mdash;&nbsp; _boolean_
  - When set to `false` `.on()` or `.once()` methods will throw an error if a duplicate event listener is added.
  - Optional. Defaults to `true` if omitted.
- **idDedupeMode** &nbsp;&mdash;&nbsp; _"ignore" | "throw" | "replace" | "update"_
  - Defines how a duplicate event listener id is handled when you provide it manually via `.on()` or `.once()` method.
    - `"ignore"`: the new listener is silently ignored and not added to the event.
    - `"throw"`: as the name suggests an error will be thrown.
    - `"replace"`: the existing listener id is removed fully before the new listener is added to the event (at the end of the listener queue).
    - `"update"`: the existing listener of the listener id is replaced with the new listener without changing the index of the listener id.
  - Optional. Defaults to `"replace"` if omitted.

```typescript
import { Emitter } from 'eventti';

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
const emitterB = new Emitter<Events>({ allowDuplicateListeners: false, idDedupeMode: 'throw' });

// You can read the `allowDuplicateListeners` setting state, but it's not
// recommended to modify it after the emitter has been instantiated (it's a
// read-only property).
emitterB.allowDuplicateListeners; // -> false

// You can read and modify the `idDedupeMode` setting freely. It's okay to
// change it's value whenever you want.
emitterB.idDedupeMode; // -> "throw"
emitterB.idDedupeMode = 'ignore';
```

**Methods**

- [on( eventName, listener, [listenerId] )](#emitter-on)
- [once( eventName, listener, [listenerId] )](#emitter-once)
- [off( [eventName], [target] )](#emitter-off)
- [emit( eventName, [...args] )](#emitter-emit)
- [listenerCount( [eventName] )](#emitter-listenerCount)

<h3><a id="emitter-on" href="#emitter-on" aria-hidden="true">#</a> <code>emitter.on( eventName, listener, [listenerId] )</code></h3>

Add a listener to an event.

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

```javascript
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

<h3><a id="emitter-once" href="#emitter-once" aria-hidden="true">#</a> <code>emitter.once( eventName, listener, [listenerId] )</code></h3>

Add a one-off listener to an event.

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

```javascript
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

<h3><a id="emitter-off" href="#emitter-off" aria-hidden="true">#</a> <code>emitter.off( [eventName], [target] )</code></h3>

Remove an event listener or multiple event listeners. If no _target_ is provided all listeners for the specified event will be removed. If no _eventName_ is provided all listeners from the emitter will be removed.

**Arguments**

- **eventName** &nbsp;&mdash;&nbsp; _string | number | symbol_ &nbsp;&mdash;&nbsp; _optional_
  - The event name specified as a string, number or symbol.
- **target** &nbsp;&mdash;&nbsp; _Function | string | number | symbol_ &nbsp;&mdash;&nbsp; _optional_
  - The event listener or listener id, which needs to be removed. If no _target_ is provided all listeners for the specified event will be removed.

**Examples**

```javascript
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

<h3><a id="emitter-emit" href="#emitter-emit" aria-hidden="true">#</a> <code>emitter.emit( eventName, [...args] )</code></h3>

Emit events.

**Arguments**

- **eventName** &nbsp;&mdash;&nbsp; _string | number | symbol_
  - The event name specified as a string, number or symbol.
- **...args** &nbsp;&mdash;&nbsp; _any_ &nbsp;&mdash;&nbsp; _optional_
  - The arguments which will be provided to the listeners when called.

**Examples**

```javascript
import { Emitter } from 'eventti';

const emitter = new Emitter();

emitter.on('test', (...args) => console.log(args.join('-')));

// Provide arguments to the event's listeners.
emitter.emit('test', 1, 2, 3, 'a', 'b', 'c');
// '1-2-3-a-b-c'
```

<h3><a id="emitter-listenerCount" href="#emitter-listenerCount" aria-hidden="true">#</a> <code>emitter.listenerCount( [eventName] )</code></h3>

Returns the listener count for an event if _eventName_ is provided. Otherwise returns the listener count for the whole emitter.

**Arguments**

- **eventName** &nbsp;&mdash;&nbsp; _string / number / symbol_
  - The event name specified as a string, number or symbol.

**Examples**

```javascript
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

<h2><a id="license" href="#license" aria-hidden="true">#</a> License</h2>

Copyright © 2022, Niklas Rämö (inramo@gmail.com). Licensed under the MIT license.
