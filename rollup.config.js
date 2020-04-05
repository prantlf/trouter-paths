import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from 'rollup-plugin-babel';
import clean from 'rollup-plugin-clean';
import { terser } from 'rollup-plugin-terser';

export default [
  {
    input: 'index.mjs',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true
    },
    plugins: [
      clean()
    ]
  },
  {
    input: 'index.mjs',
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'trouterPaths',
      sourcemap: true
    },
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      babel({
        exclude: 'node_modules/@babel/**',
        presets: [
          ['@babel/preset-env', { targets: '> 0.25%, not dead' }]
        ],
        plugins: [
          'transform-modern-regexp'
        ]
      }),
      terser()
    ]
  }
];
