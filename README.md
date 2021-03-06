# Eventti

A small, fast and reliable event emitter. Eventti provides the good 'ol event emitter API with strict types and solid performance in a compact package. As a special extra feature Eventti provides a way to remove _specific_ event listeners in scenarios where you have duplicate event listeners.

- The classic event emitter API.
- Small footprint (under 1kb gzipped).
- Highly optimized and stable performance.
- Written in TypeScript.
- Works in Node.js and modern browsers.
- No dependencies.
- MIT licensed.

<h2><a id="install" href="#install" aria-hidden="true">#</a> Install</h2>

Node

```
npm install eventti
```

Browser

```html
<script src="eventti.umd.js"></script>
```

You can access the emitters via `window.eventti` global variable in browser context.

<h2><a id="usage" href="#usage" aria-hidden="true">#</a> Usage</h2>

Eventti can be used just like most other event emitters, nothing new here really.

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

A useful extra feature of Eventti is that `.on()` and `.once()` methods return a unique listener id, which can be used to remove that specific listener.

```typescript
import { Emitter } from 'eventti';

const emitter = new Emitter();
const a = () => {};

const a1 = emitter.on('a', a);
const a2 = emitter.on('a', a);
const a3 = emitter.on('a', a);

// Remove the second a listener.
emitter.off('a', a2);

// Remove all a listeners.
emitter.off('a', a);
```

Eventti's `Emitter` allows duplicate listeners (as do most event emitter implementations), but sometimes it's preferable to disallow duplicate event listeners. For this purpose Eventti provides the `UniqueEmitter` implementation, which has identical API to `Emitter` with the exception that `.on()` and `.once()` methods return the listener function instead of a symbol.

```typescript
import { UniqueEmitter } from 'eventti';

const emitter = new UniqueEmitter();

let counter = 0;

const a = () => {
  ++counter;
};

emitter.on('a', a);
emitter.on('a', a); // ignored
emitter.on('a', a); // ignored

emitter.emit('a', 'foo');
counter === 1; // true
```

<h2><a id="special-features" href="#special-features" aria-hidden="true">#</a> Special features</h2>

<h3><a id="feat-1" href="#feat-1" aria-hidden="true">#</a> Removing specific listeners</h3>

Event emitters, which allow adding multiple instances of the same listener to an event, usually have a bit of varying behavior when it comes to removing those duplicate listeners. Calling `emitter.off('test', listener)` usually removes either the first instance of `listener` _or_ all instances of `listener`. What's missing is a way to delete specific listeners.

Eventti's `emitter.on()` and `emitter.once()` methods return a unique listener id (symbol), which can be used to remove that specific listener. In addition to that Eventti also allows you to remove listener instances based on the listener function in which case all instances of the listener function are removed.

Check out the documentation for [`emitter.off()`](#emitter-off) to see an example of this.

<h3><a id="feat-2" href="#feat-2" aria-hidden="true">#</a> Preventing duplicate listeners</h3>

Eventti's `Emitter` allows adding duplicate event listeners to events, but sometimes you might not want that behavior. To cater for scenarios where duplicate event listeners need to be automatically ignored Eventti provides `UniqueEmitter`. The API is identical to that of `Emitter`'s with the exception that `emitter.on()` and `emitter.once()` methods return the provided listener function instead of a symbol as the unique listener id.

You might be wondering why there is a separate implementation for this simple functionality, which _could_ be added to `Emitter` (as an option) with a few lines of code. Well, it turns out that when you can't have duplicate listeners you can keep the data structure more compact (at least in this specific case) and also increase the performance a little bit in certain scenarios. This way we can provide the optimal code for this specific use case.

<h3><a id="feat-3" href="#feat-3" aria-hidden="true">#</a> Faster emits with cached listener queue</h3>

One common performance issue in almost all event emitter implementations is that they _always_ clone the listener queue when an event is emitted. Although the cloning part _is_ pretty crucial for correct functionality we can speed things up by cloning the listener queue only _when necessary_, which is what Eventti does internally. Eventti uses a simple caching mechanism, which gives a nice performance boost to emit calls when the cache can be used.

<h2><a id="api" href="#api" aria-hidden="true">#</a> API</h2>

<h3><a id="emitter" href="#emitter" aria-hidden="true">#</a> Emitter</h3>

`Emitter` is a constructor function which creates an event emitter instance when instantiated with the `new` keyword. When using with TypeScript it's recommended to provide the types for the events (as demonstrated below).

```javascript
import { Emitter } from 'eventti';

// Define emitter's events (if using TypeScript).
// Let the key be the event name and the value
// be the listener callback signature.
type Events = {
  a: (msg: string) => void;
  b: (str: string, num: number) => void;
};

const emitter = new Emitter<Events>();
```

**Methods**

- [on( eventName, listener )](#emitter-on)
- [once( eventName, listener, )](#emitter-once)
- [off( [eventName], [target] )](#emitter-off)
- [emit( eventName, [...args] )](#emitter-emit)
- [listenerCount( [eventName] )](#emitter-listenerCount)

<h3><a id="emitter-on" href="#emitter-on" aria-hidden="true">#</a> <code>emitter.on( eventName, listener )</code></h3>

Add a listener to an event. You can add the same listener multiple times.

**Arguments**

- **eventName** &nbsp;&mdash;&nbsp; _String / Number / Symbol_
  - The event specified as a string, number or symbol.
- **listener** &nbsp;&mdash;&nbsp; _Function_
  - A listener function that will be called when the event is emitted.

**Returns** &nbsp;&mdash;&nbsp; _Symbol_

A listener id, which can be used to remove this specific listener.

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

<h3><a id="emitter-once" href="#emitter-once" aria-hidden="true">#</a> <code>emitter.once( eventName, listener )</code></h3>

Add a one-off listener to an event. You can add the same listener multiple times.

**Arguments**

- **eventName** &nbsp;&mdash;&nbsp; _String / Number / Symbol_
  - The event specified as a string, number or symbol.
- **listener** &nbsp;&mdash;&nbsp; _Function_
  - A listener function that will be called when the event is emitted.

**Returns** &nbsp;&mdash;&nbsp; _Symbol_

A listener id, which can be used to remove this specific listener.

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

- **eventName** &nbsp;&mdash;&nbsp; _String / Number / Symbol_ &nbsp;&mdash;&nbsp; _optional_
  - The event specified as a string, number or symbol.
- **target** &nbsp;&mdash;&nbsp; _Function / Symbol_ &nbsp;&mdash;&nbsp; _optional_
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

- **eventName** &nbsp;&mdash;&nbsp; _String / Number / Symbol_
  - The event specified as a string, number or symbol.
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

- **eventName** &nbsp;&mdash;&nbsp; _String / Number / Symbol_
  - The event specified as a string, number or symbol.

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

Copyright ?? 2022, Niklas R??m?? (inramo@gmail.com). Licensed under the MIT license.
