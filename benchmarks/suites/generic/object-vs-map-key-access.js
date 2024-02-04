#!/usr/bin/env node

import Benchmark from 'benchmark';

function formatNumber(number) {
  return String(number).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

// Create test suite.
let suite = new Benchmark.Suite();

const oString = {};
const oSymbol = {};
const mString = new Map();
const mSymbol = new Map();

const oStringKeys = [];
const oSymbolKeys = [];
const mStringKeys = [];
const mSymbolKeys = [];

let counterA = 0;
let counterB = 0;
let counterC = 0;
let counterD = 0;
let counterE = 0;
let counterF = 0;

let keyIndexA = -1;
let keyIndexB = -1;
let keyIndexC = -1;
let keyIndexD = -1;
let keyIndexE = -1;
let keyIndexF = -1;

const keyCount = 10;

for (let i = 1; i <= keyCount; i++) {
  const oStringKey = `o${i}`;
  const oSymbolKey = Symbol();
  const mStringKey = `m${i}`;
  const mSymbolKey = Symbol();

  oStringKeys.push(oStringKey);
  oSymbolKeys.push(oSymbolKey);
  mStringKeys.push(mStringKey);
  mSymbolKeys.push(mSymbolKey);

  oString[oStringKey] = i;
  oSymbol[oSymbolKey] = i;
  mString.set(mStringKey, i);
  mSymbol.set(mSymbolKey, i);
}

suite.add('Access object with string key', () => {
  ++keyIndexA;
  if (oString[oStringKeys[keyIndexA % keyCount]]) {
    ++counterA;
  }
});

suite.add('Access object with symbol key', () => {
  ++keyIndexB;
  if (oSymbol[oSymbolKeys[keyIndexB % keyCount]]) {
    ++counterB;
  }
});

suite.add('Access map with string key using .get()', () => {
  ++keyIndexC;
  if (mString.get(mStringKeys[keyIndexC % keyCount])) {
    ++counterC;
  }
});

suite.add('Access map with string key using .has()', () => {
  ++keyIndexD;
  if (mString.has(mStringKeys[keyIndexD % keyCount])) {
    ++counterD;
  }
});

suite.add('Access map with symbol key using  .get()', () => {
  ++keyIndexE;
  if (mSymbol.get(mSymbolKeys[keyIndexE % keyCount])) {
    ++counterE;
  }
});

suite.add('Access map with symbol key using .has()', () => {
  ++keyIndexF;
  if (mSymbol.has(mSymbolKeys[keyIndexF % keyCount])) {
    ++counterF;
  }
});

suite
  .on('cycle', (event) => {
    const { name, hz } = event.target;
    const result = formatNumber(hz.toFixed(0)).padStart(15);
    console.log(name);
    console.log(`  ${result} ops/sec`);
  })
  .on('error', (event) => {
    console.error(event.target.error.toString());
  })
  .run();
