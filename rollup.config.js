import typescript from '@rollup/plugin-typescript';
import pkg from './package.json';

const distFolder = './dist';

module.exports = [
  {
    input: './src/index.ts',
    output: [
      {
        name: 'Eventti',
        file: `${distFolder}/${pkg.name}.js`,
        format: 'es',
      },
      {
        name: 'Eventti',
        file: `${distFolder}/${pkg.name}.umd.js`,
        format: 'umd',
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
        format: 'es',
      },
      {
        name: 'Emitter',
        file: `${distFolder}/${pkg.name}.emitter.umd.js`,
        format: 'umd',
      },
    ],
    plugins: [typescript()],
  },
  {
    input: './src/UniqueEmitter.ts',
    output: [
      {
        name: 'UniqueEmitter',
        file: `${distFolder}/${pkg.name}.unique-emitter.js`,
        format: 'es',
      },
      {
        name: 'UniqueEmitter',
        file: `${distFolder}/${pkg.name}.unique-emitter.umd.js`,
        format: 'umd',
      },
    ],
    plugins: [typescript()],
  },
];
