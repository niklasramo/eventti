import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  outDir: './dist',
  format: ['esm', 'cjs'],
  target: false,
  minify: true,
  sourcemap: true,
  dts: true,
  platform: 'neutral',
});
