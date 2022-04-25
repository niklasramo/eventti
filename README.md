# emi

A fast, small and reliable event emitter.

## Usage

### Basic usage

```typescript
import { Emitter } from 'emi';

// Define events and their associated listener callbacks.
type Events = {
  foo: (a: string, b: number) => void;
};

// Create emitter instance.
const emitter = new Emitter<Events>();

// Create event listener.
const fooListener = (a, b) => {
  console.log(a, b);
};

// Add event listener.
emitter.on('foo', fooListener);

// Add event listener which is only emitted once.
emitter.once('foo', fooListener);

// Trigger event. First argument is the event name and the
// following arguments are passed to the listeners.
emitter.emit('foo', 'a', 1);

// Remove event listener(s).
emitter.off('foo', fooListener);
```

### Removing listeners

```typescript
import { Emitter } from 'emi';

// Define events and their associated listener callbacks.
type Events = {
  foo: (a: string, b: number) => void;
};

// Create emitter instance.
const emitter = new Emitter<Events>();

// Create event listener.
const fooListener = (a, b) => {
  console.log(a, b);
};

// Add listeners. Note that "on" method always returns
// a unique id (symbol) that can be used to remove
// the specific listener instance.
const a = emitter.on('foo', fooListener);
const b = emitter.on('foo', fooListener);
const c = emitter.on('foo', fooListener);
const d = emitter.on('foo', () => {});

// Remove specific listener (b). Note that a and c
// listeners are not removed here even though they
// share the same callback function.
emitter.off('foo', b);

// Remove all listeners that match the provided
// function. That would be a and c listeners
// in this case since b is already removed.
emitter.off('foo', fooListener);

// Remove all listeners of an event.
emitter.off('foo');

// Remove all listeners of the emitter.
emitter.off();
```

## Copyright

Copyright © 2022, Niklas Rämö (inramo@gmail.com). Licensed under the MIT license.
