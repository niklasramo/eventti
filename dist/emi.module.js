function e(e,t){(null==t||t>e.length)&&(t=e.length);for(var i=0,n=new Array(t);i<t;i++)n[i]=e[i];return n}function t(t,i){var n="undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(n)return(n=n.call(t)).next.bind(n);if(Array.isArray(t)||(n=function(t,i){if(t){if("string"==typeof t)return e(t,i);var n=Object.prototype.toString.call(t).slice(8,-1);return"Object"===n&&t.constructor&&(n=t.constructor.name),"Map"===n||"Set"===n?Array.from(t):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?e(t,i):void 0}}(t))||i&&t&&"number"==typeof t.length){n&&(t=n);var s=0;return function(){return s>=t.length?{done:!0}:{done:!1,value:t[s++]}}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}function i(e,t){var i=e.get(t);return i||(i=new n,e.set(t,i)),i}var n=/*#__PURE__*/function(){function e(){this.idMap=void 0,this.fnMap=void 0,this.onceList=void 0,this.emitList=void 0,this.idMap=new Map,this.fnMap=new Map,this.onceList=new Set,this.emitList=null}var i=e.prototype;return i.addListener=function(e,t){var i,n=this.fnMap.get(e);n||(n=new Set,this.fnMap.set(e,n));var s=Symbol();return n.add(s),this.idMap.set(s,e),t&&this.onceList.add(s),null==(i=this.emitList)||i.push(e),s},i.deleteListener=function(e){if(this.idMap.has(e)){var t=this.idMap.get(e),i=this.fnMap.get(t);this.onceList.delete(e),this.idMap.delete(e),i.delete(e),i.size||this.fnMap.delete(t),this.emitList=null}},i.deleteListeners=function(e){var i=this.fnMap.get(e);if(i){for(var n,s=t(i);!(n=s()).done;){var r=n.value;this.onceList.delete(r),this.idMap.delete(r)}this.fnMap.delete(e),this.emitList=null}},e}(),s=/*#__PURE__*/function(){function e(){this._events=void 0,this._events=new Map}var n=e.prototype;return n.on=function(e,t){return i(this._events,e).addListener(t)},n.once=function(e,t){return i(this._events,e).addListener(t,!0)},n.off=function(e,t){if(void 0!==e)if(void 0!==t){var i=this._events.get(e);i&&("function"==typeof t?i.deleteListeners(t):i.deleteListener(t),i.idMap.size||this._events.delete(e))}else this._events.delete(e);else this._events.clear()},n.emit=function(e){var i=this._events.get(e);if(i){var n=i.idMap,s=i.onceList;if(!n.size){var r=i.emitList||[].concat(n.values());if(s.size)if(s.size===n.size)this._events.delete(e);else for(var a,o=t(s);!(a=o()).done;){var l=a.value;i.deleteListener(l)}else i.emitList=r;for(var v=0,d=r.length;v<d;v++)r[v].apply(r,[].slice.call(arguments,1))}}},e}();function r(e,t){var i=e.get(t);return i||(i={listeners:new Set,onceListeners:new Set,emitList:null},e.set(t,i)),i}var a=/*#__PURE__*/function(){function e(){this._events=void 0,this._events=new Map}var i=e.prototype;return i.on=function(e,t){var i=r(this._events,e),n=i.listeners,s=i.emitList;return n.has(t)||(n.add(t),null==s||s.push(t)),t},i.once=function(e,t){var i=r(this._events,e),n=i.listeners,s=i.onceListeners,a=i.emitList;return n.has(t)||(n.add(t),s.add(t),null==a||a.push(t)),t},i.off=function(e,t){if(void 0!==e)if(void 0!==t){var i=this._events.get(e);i&&(i.listeners.delete(t),i.onceListeners.delete(t),i.emitList=null,i.listeners.size||this._events.delete(e))}else this._events.delete(e);else this._events.clear()},i.emit=function(e,i){var n=this._events.get(e);if(n){var s=n.listeners,r=n.onceListeners;if(s.size){var a=n.emitList||[].concat(s);if(r.size)if(r.size===s.size)this._events.delete(e);else{for(var o,l=t(r);!(o=l()).done;)s.delete(o.value);r.clear(),n.emitList=null}else n.emitList=a;for(var v=0,d=a.length;v<d;v++)a[v](i)}}},e}();export{s as Emitter,a as UniqueEmitter};
//# sourceMappingURL=emi.module.js.map
