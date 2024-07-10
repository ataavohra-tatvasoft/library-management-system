/* eslint-disable no-undef */
const js = require('@eslint/js')
const tsPlugin = require('@typescript-eslint/eslint-plugin')
const tsParser = require('@typescript-eslint/parser')
const prettierPlugin = require('eslint-plugin-prettier')

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      // ecmaVersion: 2015,
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        // Node.js global variables
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'readonly',
        module: 'readonly',
        require: 'readonly',
        // ES6 global variables
        Promise: 'readonly',
        Set: 'readonly',
        Map: 'readonly',
        Symbol: 'readonly',
        WeakMap: 'readonly',
        WeakSet: 'readonly',
        Reflect: 'readonly',
        Proxy: 'readonly',
        BigInt: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': 'error',
      camelcase: ['error', { properties: 'always' }],
      semi: ['error', 'never'],
      'prettier/prettier': 'error'
    }
  }
]
