import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  outDir: './dist',
  format: ['esm', 'umd'],
  target: false,
  minify: true,
  sourcemap: true,
  dts: true,
  platform: 'neutral',
  globalName: 'eventti-tests',
});
