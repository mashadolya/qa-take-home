import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'node_modules/',
      'playwright-report/',
      'test-results/',
      '.playwright-cli/',
      '.claude/',
    ],
  },
  {
    files: ['**/*.{ts,mjs,js}'],
    languageOptions: { parser: tseslint.parser },
    rules: {
      // always use braces, even for one-line if/for/while bodies (Google / Airbnb style)
      curly: ['error', 'all'],
    },
  },
  {
    // Naming (Google TS style / Airbnb 23.10): UPPER_CASE only for primitive constants
    // (const PORT = 3100); objects, arrays, regexps and functions are camelCase (apiRoutes.formImages(id)).
    files: ['**/*.ts'],
    plugins: { '@typescript-eslint': tseslint.plugin },
    languageOptions: {
      parserOptions: { project: ['./e2e/tsconfig.json'], tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'default', format: ['camelCase'] },
        { selector: 'import', format: ['camelCase', 'PascalCase'] },
        { selector: 'variable', format: ['camelCase'] },
        {
          selector: 'variable',
          modifiers: ['const', 'global'],
          types: ['string', 'number', 'boolean'],
          format: ['UPPER_CASE', 'camelCase'],
        },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['UPPER_CASE'] },
        // env variable names passed to the webServer (PORT, DB_PATH, BUGS) and quoted keys like 'content-type'
        { selector: 'objectLiteralProperty', filter: '^[A-Z][A-Z_]*$', format: ['UPPER_CASE'] },
        { selector: 'objectLiteralProperty', modifiers: ['requiresQuotes'], format: null },
      ],
    },
  },
);
