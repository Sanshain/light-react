

import typescript from '@rollup/plugin-typescript';          // https://github.com/rollup/plugins/tree/master/packages/typescript

export default {
  input: 'init.ts',
  output: {    
    file: 'release/*.js',
    format: 'iife'
    // format: 'esm'
  },  
  plugins: [
    typescript({lib: ["es5", "es6", "dom"], target: "es5"})
  ]
}