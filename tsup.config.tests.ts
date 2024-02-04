import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'tests/src/index.ts',
  },
  outDir: './tests/dist',
  format: ['esm', 'iife'],
  minify: false,
  dts: false,
  external: ['chai', 'mocha'],
});
