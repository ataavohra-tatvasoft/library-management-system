const js = require('@eslint/js') // eslint-disable-line no-undef
const tsPlugin = require('@typescript-eslint/eslint-plugin') // eslint-disable-line no-undef
const tsParser = require('@typescript-eslint/parser') // eslint-disable-line no-undef
const prettierPlugin = require('eslint-plugin-prettier') // eslint-disable-line no-undef

// eslint-disable-next-line no-undef
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
