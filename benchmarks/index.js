#!/usr/bin/env node

import { suite as emitSuite } from './suites/lib/emit.js';
import { suite as onSuite } from './suites/lib/on.js';
import { suite as onceSuite } from './suites/lib/once.js';
import { suite as offSuite } from './suites/lib/off.js';

// Map for easier access to suites by name
const suiteMap = {
  emit: emitSuite,
  on: onSuite,
  once: onceSuite,
  off: offSuite,
};

// Function to get suites from CLI arguments
function getSuitesFromArgs() {
  const args = process.argv.slice(2); // Remove the first two elements (node path and script path)
  const suites = [];

  args.forEach((arg) => {
    if (suiteMap[arg]) {
      suites.push(suiteMap[arg]);
    } else {
      console.log(
        `No suite found for '${arg}'. Available options are: ${Object.keys(suiteMap).join(', ')}.`,
      );
    }
  });

  return suites;
}

const suites = getSuitesFromArgs();

// If no specific suites are specified, run all suites
if (suites.length === 0) {
  console.log('No specific suites specified, running all suites.');
  suites.push(...Object.values(suiteMap));
}

// Setup suites to run in sequence
for (let i = 0; i < suites.length; ++i) {
  const suite = suites[i];
  const nextSuite = suites[i + 1];

  suite.on('start', function () {
    console.log(`Suite: ${suite.name}`);
  });

  if (nextSuite) {
    suite.on('complete', function () {
      console.log('');
      nextSuite.run();
    });
  }
}

// Start running suites
if (suites.length > 0) {
  suites[0].run();
} else {
  console.log('No suites to run.');
}
