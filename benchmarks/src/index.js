#!/usr/bin/env node
import suite1 from './suites/1.js';
import suite2 from './suites/2.js';
import suite3 from './suites/3.js';
import suite4 from './suites/4.js';
import suite5 from './suites/5.js';
import suite6 from './suites/6.js';

const suiteMap = {
  1: suite1,
  2: suite2,
  3: suite3,
  4: suite4,
  5: suite5,
  6: suite6,
};

async function runSuites() {
  const args = process.argv.slice(2);
  const suiteNames = args.length ? args.filter((arg) => suiteMap[arg]) : Object.keys(suiteMap);

  for (const suiteName of suiteNames) {
    console.log(`\nRunning suite ${suiteName} benchmarks:\n`);
    await suiteMap[suiteName]();
  }
}

runSuites().catch(console.error);
