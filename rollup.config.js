

import typescript from '@rollup/plugin-typescript';          // https://github.com/rollup/plugins/tree/master/packages/typescript
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'init.ts',
  output: {  
    file: 'release/lib.js',
    format: 'cjs'
    // format: 'iife',
    // format: 'esm'
  },  
  plugins: [
    typescript({module: 'CommonJS', tsconfig: false, lib: ["es5", "es6", "dom"], target: "es5"}),
    commonjs({ extensions: ['.js', '.ts'] }) 
  ]
}