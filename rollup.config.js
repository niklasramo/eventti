import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import pkg from './package.json' assert { type: 'json' };

export default [
  // Build library.
  {
    input: pkg.source,
    output: [
      {
        file: pkg.exports['.'].import,
        format: 'es',
      },
      {
        file: pkg.exports['.'].require,
        format: 'cjs',
      },
      {
        name: pkg.name,
        file: pkg['umd:main'],
        format: 'umd',
      },
    ],
    plugins: [typescript()],
  },
  // Build type defintions.
  {
    input: pkg.source,
    output: [{ file: pkg.types, format: 'es' }],
    plugins: [dts()],
  },
  // Build browser test suite.
  {
    input: './tests/src/tests.ts',
    output: [
      {
        file: './tests/dist/tests.node.js',
        format: 'es',
      },
      {
        file: './tests/dist/tests.browser.js',
        format: 'umd',
        name: `${pkg.name}_testsuite`,
        globals: { chai: 'chai' },
      },
    ],
    external: ['chai'],
    plugins: [typescript()],
  },
];
