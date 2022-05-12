import typescript from '@rollup/plugin-typescript';
import pkg from './package.json';

module.exports = [
  {
    input: pkg.source,
    output: [
      {
        name: pkg.name,
        file: pkg.main,
        format: 'es',
      },
      {
        name: pkg.name,
        file: pkg['umd:main'],
        format: 'umd',
      },
    ],
    plugins: [typescript()],
  },
];
