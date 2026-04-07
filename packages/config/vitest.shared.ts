import type { ViteUserConfig } from 'vitest/config';
import { defineConfig, mergeConfig } from 'vitest/config';

export function createVitestConfig(overrides?: ViteUserConfig) {
  return mergeConfig(
    defineConfig({
      test: {
        globals: true,
        coverage: {
          provider: 'v8',
          include: ['src/**/*.ts'],
          exclude: ['**/*.test.ts', '**/*.spec.ts'],
          reporter: ['text', 'json', 'html', 'lcov'],
          thresholds: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
          },
        },
      },
    }),
    overrides ?? {},
  );
}
