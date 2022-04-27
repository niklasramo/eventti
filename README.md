# Emi

A fast, small and reliable event emitter. Emi provides the good 'ol event emitter API with stable performance across the browsers and with a few carefully thought additional features.

- The classic event emitter API.
- Small footprint (less than 1kb gzipped).
- Highly optimized and stable performance.
- Written in TypeScript.
- Works in Node.js and modern browsers.
- No dependencies.
- MIT licensed.

<h2><a id="install" href="#install" aria-hidden="true">#</a> Install</h2>

Node

```
npm install emi
```

Browser

```html
<script src="emi.umd.js"></script>
```

<h2><a id="basic-usage" href="#basic-usage" aria-hidden="true">#</a> Basic usage</h2>

```typescript
import { Emitter } from 'emi';

const emitter = new Emitter();
const listener = (msg) => console.log(msg);

emitter.on('test', listener);
emitter.emit('test', 'Hello World!');
emitter.off('test', listener);
```

<h2><a id="special-features" href="#special-features" aria-hidden="true">#</a> Special features</h2>

<h3><a id="feat-1" href="#feat-1" aria-hidden="true">#</a> Removing specific listeners</h3>

Event emitters, which allow adding multiple instances of the same listener to an event, usually have a bit of varying behavior when it comes to removing those duplicate listeners. Calling `emitter.off('test', listener)` usually removes either the first instance of `listener` _or_ all instances of `listener`. What's missing is a way to delete specific listeners.

Emi's `emitter.on()` and `emitter.once()` mehthods return a unique listener id (symbol), which can be used to remove that specific listener. In addition to that Emi also allows you to remove listener instances based on the listener function in which case all instances of the listener function are removed.

Check out the documentation for [`emitter.off()`](#emitter-off) to see an examples of this.

<h3><a id="feat-2" href="#feat-2" aria-hidden="true">#</a> Handling duplicate listeners</h3>

To cater for scenarios where duplicate events are absolutely not wanted Emi provides `UniqueEmitter` class which _silently_ ignores duplicate listeners. The API is identical to `Emitter` with the exception that `emitter.on()` and `emitter.once()` mehthods return the listener function instead of a symbol as the unique listener id. "But why does it have to be it's own class?" you might ask. Well, it turns out that there is actually much less bookkeeping involved when you can't have duplicate listeners and you can keep the data structure much simpler. This way we can provide the optimal code for this specific use case.

<h3><a id="feat-4" href="#feat-4" aria-hidden="true">#</a> Faster emits with cached listener queue</h3>

TODO: Write explanation...

<h2><a id="api" href="#api" aria-hidden="true">#</a> API</h2>

<h3><a id="emitter" href="#emitter" aria-hidden="true">#</a> Emitter</h3>

`Emitter` is a constructor function which creates an event emitter instance when instantiated with the `new` keyword.

```javascript
import { Emitter } from 'emi';
const emitter = new Emitter();
```

NOTE: You can add the same event listener function multiple times to an event. This is a feature, not a bug. If you don't want to allow duplicate event listeners, please use `UniqueEmitter`.

```javascript
import { UniqueEmitter } from 'emi';
const emitter = new UniqueEmitter();
```

**Methods**

- [on( eventType, listener )](#emitter-on)
- [once( eventType, listener, )](#emitter-once)
- [off( [eventType], [target] )](#emitter-off)
- [emit( eventType, [...args] )](#emitter-emit)

<h3><a id="emitter-on" href="#emitter-on" aria-hidden="true">#</a> <code>emitter.on( eventType, listener )</code></h3>

Add a listener to an event. You can add the same listener multiple times.

**Arguments**

- **eventType** &nbsp;&mdash;&nbsp; _String / Number / Symbol_
  - The event specified as a string, number or symbol.
- **listener** &nbsp;&mdash;&nbsp; _Function_
  - A listener function that will be called when the event is emitted.

**Returns** &nbsp;&mdash;&nbsp; _Symbol_

A listener id, which can be used to remove this specific listener.

**Examples**

```javascript
import { Emitter } from 'emi';

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

<h3><a id="emitter-once" href="#emitter-once" aria-hidden="true">#</a> <code>emitter.once( eventType, listener )</code></h3>

Add a one-off listener to an event.

**Arguments**

- **eventType** &nbsp;&mdash;&nbsp; _String / Number / Symbol_
  - The event specified as a string, number or symbol.
- **listener** &nbsp;&mdash;&nbsp; _Function_
  - A listener function that will be called when the event is emitted.

**Returns** &nbsp;&mdash;&nbsp; _Symbol_

A listener id, which can be used to remove this specific listener.

**Examples**

```javascript
import { Emitter } from 'emi';

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

<h3><a id="emitter-off" href="#emitter-off" aria-hidden="true">#</a> <code>emitter.off( [eventType], [target] )</code></h3>

Remove an event listener or multiple event listeners. If no _target_ is provided all listeners for the specified event will be removed. If no _eventType_ is provided all listeners from the emitter will be removed.

**Arguments**

- **eventType** &nbsp;&mdash;&nbsp; _String / Number / Symbol_ &nbsp;&mdash;&nbsp; _optional_
  - The event specified as a string, number or symbol.
- **target** &nbsp;&mdash;&nbsp; _Function / Symbol_ &nbsp;&mdash;&nbsp; _optional_
  - Target removable event listeners by specific function or listener id. If no _target_ is provided all listeners for the specified event will be removed.

**Examples**

```javascript
import { Emitter } from 'emi';

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

// Remove all listeners of an event.
emitter.off('test');

// Remove all listeners of the emitter.
emitter.off();
```

<h3><a id="emitter-emit" href="#emitter-emit" aria-hidden="true">#</a> <code>emitter.emit( eventType, [...args] )</code></h3>

Emit events.

**Arguments**

- **eventType** &nbsp;&mdash;&nbsp; _String / Number / Symbol_
  - The event specified as a string, number or symbol.
- **...args** &nbsp;&mdash;&nbsp; _Array_ &nbsp;&mdash;&nbsp; _optional_
  - The arguments which will be provided to the listeners when called.

**Examples**

```javascript
import { Emitter } from 'emi';

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

// Remove all listeners of an event.
emitter.off('test');

// Remove all listeners of the emitter.
emitter.off();
```

<h2><a id="license" href="#license" aria-hidden="true">#</a> License</h2>

Copyright © 2022, Niklas Rämö (inramo@gmail.com). Licensed under the MIT license.
