!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((e="undefined"!=typeof globalThis?globalThis:e||self).UniqueEmitter={})}(this,(function(e){"use strict";function t(e,t){let s=e.get(t);return s||(s={list:new Set,onceList:new Set,emitList:null},e.set(t,s)),s}e.UniqueEmitter=class{_events;constructor(){this._events=new Map}on(e,s){const{list:i,emitList:n}=t(this._events,e);return i.has(s)||(i.add(s),n&&n.push(s)),s}once(e,s){const{list:i,onceList:n,emitList:o}=t(this._events,e);return i.has(s)||(i.add(s),n.add(s),o&&o.push(s)),s}off(e,t){if(void 0===e)return void this._events.clear();if(void 0===t)return void this._events.delete(e);const s=this._events.get(e);s&&s.list.has(t)&&(s.list.delete(t),s.onceList.delete(t),s.emitList=null,s.list.size||this._events.delete(e))}emit(e,...t){const s=this._events.get(e);if(!s)return;const{list:i,onceList:n,emitList:o}=s;if(!i.size)return;const l=o||[...i];if(n.size)if(n.size===i.size)this._events.delete(e);else{for(const e of n)i.delete(e);n.clear(),s.emitList=null}else s.emitList=l;let r=0,d=l.length;for(;r<d;r++)l[r](...t)}},Object.defineProperty(e,"__esModule",{value:!0})}));