// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'logs/**', '**/*.js', '**/*.mjs'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@thallesp/nestjs-better-auth',
              importNames: ['AllowAnonymous', 'OptionalAuth'],
              message:
                'Use @/shared/decorators/allow-anonymous.decorator or optional-auth.decorator instead.',
            },
          ],
        },
      ],
    },
  },
  {
    // Allow the wrapper files themselves to import from the library.
    files: [
      'src/shared/decorators/allow-anonymous.decorator.ts',
      'src/shared/decorators/optional-auth.decorator.ts',
    ],
    rules: { 'no-restricted-imports': 'off' },
  },
);
