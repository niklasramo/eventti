export function addFillEvents(emitter, count = 1000) {
  for (let i = 0; i < count; i++) {
    emitter.on(`fill-event-${i}`, () => {});
  }
}
