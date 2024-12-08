import globals from 'globals';

import pluginJs from '@eslint/js';

import tsEslint from 'typescript-eslint';

import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

import eslintPluginImport from 'eslint-plugin-import';

export default [
  { files: ['**/*.ts'] },
  eslintPluginImport.flatConfigs.recommended,
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/*.mjs'],
  },
  {
    rules: {
      'padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: 'block',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: 'case',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: 'cjs-import',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: 'class',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: 'const',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: 'default',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: 'directive',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: 'export',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: 'expression',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: 'for',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: 'let',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: 'multiline-block-like',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: 'multiline-expression',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: 'singleline-const',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: 'singleline-let',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: 'singleline-var',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: 'switch',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: 'try',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: 'var',
          next: '*',
        },
        {
          blankLine: 'always',
          prev: 'while',
          next: '*',
        },
      ],
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/explicit-function-return-type': ['error'],
      'eol-last': ['error', 'always'],
      'brace-style': ['error', '1tbs'],
      'arrow-parens': ['error', 'always'],
      'object-curly-spacing': ['error', 'always'],
      'prettier/prettier': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/camelcase': 'off',
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          overrides: {
            accessors: 'explicit',
            constructors: 'explicit',
            methods: 'explicit',
            properties: 'explicit',
            parameterProperties: 'explicit',
          },
        },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase'],
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
      ],
      'import/order': [
        'error',
        {
          groups: [['external', 'builtin'], ['internal'], ['index', 'sibling', 'parent', 'object']],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          pathGroupsExcludedImportTypes: ['builtin'],
          pathGroups: [
            {
              pattern: '@libs/**',
              group: 'internal',
            },
          ],
        },
      ],
      'import/no-unresolved': 0,
      '@typescript-eslint/no-empty-function': 0,
      'lines-between-class-members': [
        'error',
        'always',
        {
          exceptAfterSingleLine: true,
        },
      ],
      'no-unused-vars': 'error',
      '@typescript-eslint/no-unused-vars': 2,
      'import/export': 0,
      'object-property-newline': [
        'error',
        {
          allowAllPropertiesOnSameLine: false,
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          fixStyle: 'inline-type-imports',
        },
      ],
      'object-shorthand': ['error'],
    },
  },
  { languageOptions: { globals: { ...globals.node } } },
  pluginJs.configs.recommended,
  ...tsEslint.configs.recommended,
  eslintPluginPrettierRecommended,
];
