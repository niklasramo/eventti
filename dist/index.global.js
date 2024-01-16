"use strict";var eventti=(()=>{var o=Object.defineProperty;var v=Object.getOwnPropertyDescriptor;var u=Object.getOwnPropertyNames;var f=Object.prototype.hasOwnProperty;var h=(s,e)=>{for(var t in e)o(s,t,{get:e[t],enumerable:!0})},c=(s,e,t,n)=>{if(e&&typeof e=="object"||typeof e=="function")for(let i of u(e))!f.call(s,i)&&i!==t&&o(s,i,{get:()=>e[i],enumerable:!(n=v(e,i))||n.enumerable});return s};var L=s=>c(o({},"__esModule",{value:!0}),s);var m={};h(m,{Emitter:()=>l,EmitterIdDedupeMode:()=>a});var a={APPEND:"append",UPDATE:"update",IGNORE:"ignore",THROW:"throw"};function E(s,e){let t=s.get(e);return t||(t=new p,s.set(e,t)),t}var p=class{constructor(){this.idMap=new Map,this.fnMap=new Map,this.onceList=new Set,this.emitList=null}add(e,t,n,i,d){if(!d&&this.fnMap.has(e))throw new Error("Emitter: tried to add an existing event listener to an event!");if(this.idMap.has(n))switch(i){case a.THROW:throw new Error("Emitter: tried to add an existing event listener id to an event!");case a.IGNORE:return n;default:this.delId(n,i===a.UPDATE)}let r=this.fnMap.get(e);return r||(r=new Set,this.fnMap.set(e,r)),r.add(n),this.idMap.set(n,e),t&&this.onceList.add(n),this.emitList&&this.emitList.push(e),n}delId(e,t=!1){let n=this.idMap.get(e);if(!n)return;let i=this.fnMap.get(n);t||this.idMap.delete(e),this.onceList.delete(e),i.delete(e),i.size||this.fnMap.delete(n),this.emitList=null}delFn(e){let t=this.fnMap.get(e);t&&(t.forEach(n=>{this.onceList.delete(n),this.idMap.delete(n)}),this.fnMap.delete(e),this.emitList=null)}},l=class{constructor(e={}){let{idDedupeMode:t=a.APPEND,allowDuplicateListeners:n=!0}=e;this.idDedupeMode=t,this.createId=e.createId||Symbol,this.allowDuplicateListeners=n,this._events=new Map}_getListeners(e){let t=this._events.get(e);if(!t)return null;let{idMap:n,onceList:i}=t;if(!n.size)return null;let d=t.emitList||[...n.values()];if(i.size)if(i.size===n.size)this._events.delete(e);else for(let r of i)t.delId(r);else t.emitList=d;return d}on(e,t,n=this.createId()){return E(this._events,e).add(t,!1,n,this.idDedupeMode,this.allowDuplicateListeners)}once(e,t,n=this.createId()){return E(this._events,e).add(t,!0,n,this.idDedupeMode,this.allowDuplicateListeners)}off(e,t){if(e===void 0){this._events.clear();return}if(t===void 0){this._events.delete(e);return}let n=this._events.get(e);n&&(typeof t=="function"?n.delFn(t):n.delId(t),n.idMap.size||this._events.delete(e))}emit(e,...t){let n=this._getListeners(e);if(!n)return;let i=0,d=n.length;for(;i<d;i++)n[i](...t)}listenerCount(e){if(e===void 0){let t=0;return this._events.forEach((n,i)=>{t+=this.listenerCount(i)}),t}return this._events.get(e)?.idMap.size||0}};return L(m);})();
