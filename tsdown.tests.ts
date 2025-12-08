import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'tests/src/index.ts',
  },
  outDir: './tests/dist',
  format: ['esm', 'umd'],
  target: false,
  minify: true,
  sourcemap: true,
  dts: true,
  platform: 'neutral',
  globalName: 'eventti-tests',
});
