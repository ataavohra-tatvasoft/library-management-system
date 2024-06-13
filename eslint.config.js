import js from '@eslint/js';

export default [
    js.configs.recommended,

    {
        // Override or configure specific ESLint rules
        rules: {

            'no-undef': 'error',
            'no-unused-vars': 'error',

            // Enforce Prettier formatting based on your Prettier configuration
            // 'prettier/recommended': ['error'],

            // Enforce camelCase naming convention for variables and properties
            camelcase: ['error', { properties: 'always' }],

            // Additional rule customizations (adjust based on your needs)
            // 'import/no-unresolved': ['error', { ignoreCase: true }],

            semi: ['error', 'always'],
        },

        // Enable additional plugins (replace with desired plugins)
        plugins: {
            prettier: {}, // Empty object for Prettier plugin
            import: {}, // Empty object for import plugin
        },
    },
];
