import typescript from '@rollup/plugin-typescript';
import pkg from './package.json';

const distFolder = './dist';

module.exports = [
  {
    input: './src/index.ts',
    output: [
      {
        name: 'Emi',
        file: `${distFolder}/${pkg.name}.js`,
        format: 'umd',
      },
      {
        name: 'Emi',
        file: `${distFolder}/${pkg.name}.mjs`,
        format: 'es',
      },
    ],
    plugins: [typescript()],
  },
  {
    input: './src/Emitter.ts',
    output: [
      {
        name: 'Emitter',
        file: `${distFolder}/${pkg.name}.emitter.js`,
        format: 'umd',
      },
      {
        name: 'Emitter',
        file: `${distFolder}/${pkg.name}.emitter.mjs`,
        format: 'es',
      },
    ],
    plugins: [typescript()],
  },
  {
    input: './src/UniqueEmitter.ts',
    output: [
      {
        name: 'Emitter',
        file: `${distFolder}/${pkg.name}.unique-emitter.js`,
        format: 'umd',
      },
      {
        name: 'Emitter',
        file: `${distFolder}/${pkg.name}.unique-emitter.mjs`,
        format: 'es',
      },
    ],
    plugins: [typescript()],
  },
];
