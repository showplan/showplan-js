module.exports = {
    env: {
        browser: true,
        es6: true,
        jest: true
    },
    extends: [
        "airbnb-base",
        "plugin:@typescript-eslint/recommended"
    ],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
        ecmaVersion: 2018,
        sourceType: 'module',
        // project: './tsconfig.json', // this has a big time perf hit right now
        tsconfigRootDir: './',
    },
    plugins: [
        '@typescript-eslint',
    ],
    settings: {
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx']
        },
        'import/resolver': {
            typescript: {},
        },
    },
    rules: {
        'import/prefer-default-export': 0,
        'import/no-unresolved': 'error',
        'class-methods-use-this': 0,
        'max-len': [1, 260, 2],
        'linebreak-style': 0,
        indent: ['error', 4, {
            SwitchCase: 1,
        }],
        '@typescript-eslint/explicit-function-return-type': ['warn', {
            allowExpressions: true
        }],
    },
};
