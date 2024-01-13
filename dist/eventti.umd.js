!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((e="undefined"!=typeof globalThis?globalThis:e||self).eventti={})}(this,(function(e){"use strict";const t={APPEND:"append",UPDATE:"update",IGNORE:"ignore",THROW:"throw"};function i(e,t){let i=e.get(t);return i||(i=new s,e.set(t,i)),i}class s{constructor(){this.idMap=new Map,this.fnMap=new Map,this.onceList=new Set,this.emitList=null}add(e,i,s,n,d){if(!d&&this.fnMap.has(e))throw new Error("Emitter: tried to add an existing event listener to an event!");if(this.idMap.has(s))switch(n){case t.THROW:throw new Error("Emitter: tried to add an existing event listener id to an event!");case t.IGNORE:return s;default:this.delId(s,n===t.UPDATE)}let o=this.fnMap.get(e);return o||(o=new Set,this.fnMap.set(e,o)),o.add(s),this.idMap.set(s,e),i&&this.onceList.add(s),this.emitList&&this.emitList.push(e),s}delId(e,t=!1){const i=this.idMap.get(e);if(!i)return;const s=this.fnMap.get(i);t||this.idMap.delete(e),this.onceList.delete(e),s.delete(e),s.size||this.fnMap.delete(i),this.emitList=null}delFn(e){const t=this.fnMap.get(e);t&&(t.forEach((e=>{this.onceList.delete(e),this.idMap.delete(e)})),this.fnMap.delete(e),this.emitList=null)}}e.Emitter=class{constructor(e={}){const{idDedupeMode:i=t.APPEND,allowDuplicateListeners:s=!0}=e;this.idDedupeMode=i,this.allowDuplicateListeners=s,this._events=new Map}_getListeners(e){const t=this._events.get(e);if(!t)return null;const{idMap:i,onceList:s}=t;if(!i.size)return null;const n=t.emitList||[...i.values()];if(s.size)if(s.size===i.size)this._events.delete(e);else for(const e of s)t.delId(e);else t.emitList=n;return n}on(e,t,s=Symbol()){return i(this._events,e).add(t,!1,s,this.idDedupeMode,this.allowDuplicateListeners)}once(e,t,s=Symbol()){return i(this._events,e).add(t,!0,s,this.idDedupeMode,this.allowDuplicateListeners)}off(e,t){if(void 0===e)return void this._events.clear();if(void 0===t)return void this._events.delete(e);const i=this._events.get(e);i&&("function"==typeof t?i.delFn(t):i.delId(t),i.idMap.size||this._events.delete(e))}emit(e,...t){const i=this._getListeners(e);if(!i)return;let s=0,n=i.length;for(;s<n;s++)i[s](...t)}listenerCount(e){if(void 0===e){let e=0;return this._events.forEach(((t,i)=>{e+=this.listenerCount(i)})),e}return this._events.get(e)?.idMap.size||0}},e.EventListenerIdDedupeMode=t}));