#!/usr/bin/env node

import Benchmark from 'benchmark';
import { logResult } from './log-result.js';

export function createSuite(name) {
  const suite = new Benchmark.Suite(name);

  suite.on('cycle', logResult).on('error', (event) => {
    console.error(event.target.error.toString());
  });

  return suite;
}
