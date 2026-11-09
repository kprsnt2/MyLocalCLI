import globals from 'globals';

export default [
    {
        ignores: ['node_modules/**', 'coverage/**', 'dist/**', 'web/**']
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.node,
                ...globals.es2022
            }
        },
        rules: {
            // Errors / Warnings
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-undef': 'error',
            'no-console': 'off', // CLI app uses console

            // Warnings
            'prefer-const': 'warn',
            'no-var': 'warn',
            'eqeqeq': ['warn', 'smart'],

            // Style (relaxed for existing code)
            'semi': ['warn', 'always'],
            'quotes': ['warn', 'single', { avoidEscape: true }],
            'indent': 'off', // Leave to Prettier
            'comma-dangle': 'off'
        }
    },
    {
        files: ['tests/**/*.js'],
        languageOptions: {
            globals: {
                ...globals.node,
                describe: 'readonly',
                it: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                vi: 'readonly'
            }
        }
    }
];
