

import typescript from '@rollup/plugin-typescript';          // https://github.com/rollup/plugins/tree/master/packages/typescript

export default {
  input: 'init.ts',
  output: {  
    file: 'release/lib.js',
    name: 'vom',
    // format: 'cjs'
    format: 'iife',
    sourcemap: true    
    // format: 'esm'
  },
  plugins: [
    typescript({
      // module: 'CommonJS', 
      // tsconfig: false, 
      lib: ["es6", "dom"], //es5
      target: "es5",
      sourceMap: true
    }),    
  ]
}
