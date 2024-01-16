import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  outDir: './dist',
  format: ['esm', 'cjs', 'iife'],
  minify: true,
  dts: true,
  globalName: 'eventti',
});
