#!/usr/bin/env node

import { suite as emitSuite } from './suites/lib/emit.js';
import { suite as onSuite } from './suites/lib/on.js';
import { suite as onceSuite } from './suites/lib/once.js';
import { suite as offSuite } from './suites/lib/off.js';

// Collect all suites.
const suites = [onSuite, onceSuite, offSuite, emitSuite];

// Setup suites to run in sequence.
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

// Start running suites.
suites[0].run();
