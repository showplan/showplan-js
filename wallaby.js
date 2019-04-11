/* eslint-disable global-require */
module.exports = function config(w) {
    return {
        files: [
            'tsconfig.json',
            'tsconfig.jest.json',
            'src/**/*.ts',
            'tests/**/*.sqlplan',
            '!tests/*.ts',
        ],

        tests: ['tests/**/*.ts'],

        compilers: {
            '**/*.ts?(x)': w.compilers.typeScript(require('./tsconfig.jest.json').compilerOptions),
        },

        env: {
            type: 'node',
            runner: 'node',
        },

        testFramework: 'jest',
    };
};
