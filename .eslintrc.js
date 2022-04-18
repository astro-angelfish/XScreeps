// @ts-check

/**
 * ESLint Configuration File
 *
 * Docs: https://eslint.org/docs/user-guide/configuring
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
  root: true,
  extends: ['@antfu/ts'],
  rules: {
    'no-console': 'off',
    '@typescript-eslint/no-unused-vars': 'off',

    'object-property-newline': 'off',
  },
  overrides: [
    {
      files: ['./*.config.js', './*rc.js', '**/scripts/**/*.js'],
      env: {
        node: true,
      },
      rules: {
        'no-var-requires': 'off',
      },
    },
    {
      files: ['*.js', '*.jsx'],
      env: {
        es2020: true,
        browser: true,
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      env: {
        es2020: true,
        browser: true,
      },
      parser: '@typescript-eslint/parser',
    },
  ],
}
