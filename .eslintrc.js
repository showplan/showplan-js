module.exports = {
    env: {
        browser: true,
        es6: true,
    },
    extends: [
        "airbnb-base"
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
        extraFileExtensions: ['.vue'],
    },
    plugins: [
        '@typescript-eslint',
    ],
    settings: {
        'import/resolver': {
            typescript: {},
        },
    },
    rules: {
        'class-methods-use-this': 0,
        'max-len': [1, 260, 2],
        'linebreak-style': 0,
        indent: ['error', 4, {
            SwitchCase: 1,
        }],
    },
};
