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
];
