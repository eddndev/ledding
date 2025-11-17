import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';

const production = !process.env.ROLLUP_WATCH;

export default [
  // ESM build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/ledding.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
    ],
  },
  // ESM minified
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/ledding.esm.min.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
      production && terser({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
        },
      }),
    ],
  },
  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/ledding.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
    ],
  },
  // UMD build (browser global)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/ledding.umd.js',
      format: 'umd',
      name: 'Ledding',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
    ],
  },
  // UMD minified
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/ledding.umd.min.js',
      format: 'umd',
      name: 'Ledding',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
      production && terser(),
    ],
  },
  // TypeScript declarations
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'esm',
    },
    plugins: [dts()],
  },
];
