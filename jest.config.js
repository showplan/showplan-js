module.exports = {
    testEnvironment: 'node',
    moduleFileExtensions: ['js', 'jsx', 'json', 'ts', 'tsx'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testMatch: ['**/tests/**/*.spec.(js|ts|tsx)|**/__tests__/*.(js|ts|tsx)'],
    globals: {
        'ts-jest': {
            tsConfig: 'tsconfig.jest.json',
        },
    },
};
