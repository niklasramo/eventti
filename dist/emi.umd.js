!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((e||self).emi={})}(this,function(e){"use strict";function t(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,i=new Array(t);n<t;n++)i[n]=e[n];return i}function n(e,n){var i="undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(i)return(i=i.call(e)).next.bind(i);if(Array.isArray(e)||(i=function(e,n){if(e){if("string"==typeof e)return t(e,n);var i=Object.prototype.toString.call(e).slice(8,-1);return"Object"===i&&e.constructor&&(i=e.constructor.name),"Map"===i||"Set"===i?Array.from(e):"Arguments"===i||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(i)?t(e,n):void 0}}(e))||n&&e&&"number"==typeof e.length){i&&(e=i);var r=0;return function(){return r>=e.length?{done:!0}:{done:!1,value:e[r++]}}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var i=/*#__PURE__*/function(){function e(){this.idMap=void 0,this.fnMap=void 0,this.onceList=void 0,this.idMap=new Map,this.fnMap=new Map,this.onceList=new Set}var t=e.prototype;return t.addListener=function(e,t){var n=Symbol(),i=this.fnMap.get(e);return i||(i=new Set,this.fnMap.set(e,i)),i.add(n),this.idMap.set(n,e),t&&this.onceList.add(n),n},t.deleteListenerById=function(e){if(this.idMap.has(e)){var t=this.idMap.get(e),n=this.fnMap.get(t);this.onceList.delete(e),this.idMap.delete(e),n.delete(e),n.size||this.fnMap.delete(t)}},t.deleteMatchingListeners=function(e){var t=this.fnMap.get(e);if(t){for(var i,r=n(t);!(i=r()).done;){var o=i.value;this.onceList.delete(o),this.idMap.delete(o)}this.fnMap.delete(e)}},t.deleteOnceListeners=function(){for(var e,t=n(this.onceList);!(e=t()).done;)this.deleteListenerById(e.value)},e}(),r=/*#__PURE__*/function(){function e(){this._events=void 0,this._once=void 0,this._events=new Map,this._once=!1}var t=e.prototype;return t.on=function(e,t){var n=this._once;this._once=!1;var r=this._events.get(e);if(r)return r.addListener(t,n);var o=(r=new i).addListener(t,n);return this._events.set(e,r),o},t.once=function(e,t){return this._once=!0,this.on(e,t)},t.off=function(e,t){if(void 0!==e)if(void 0!==t){var n=this._events.get(e);n&&("function"==typeof t?n.deleteMatchingListeners(t):n.deleteListenerById(t),n.idMap.size||this._events.delete(e))}else this._events.delete(e);else this._events.clear()},t.emit=function(e){var t=this._events.get(e);if(t){var n=[].concat(t.idMap.values());t.deleteOnceListeners();for(var i=0,r=n.length;i<r;i++)n[i].apply(n,[].slice.call(arguments,1))}},e}();e.Emitter=r});
//# sourceMappingURL=emi.umd.js.map
