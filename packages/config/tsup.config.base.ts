import type { Options } from 'tsup';

export function createTsupConfig(overrides?: Partial<Options>): Options {
  return {
    entry: ['src/**/*.ts', '!src/**/*.test.ts', '!src/**/*.spec.ts'],
    format: ['cjs', 'esm'],
    bundle: false,
    dts: {
      compilerOptions: {
        composite: false,
        ignoreDeprecations: '6.0',
      },
    },
    sourcemap: true,
    clean: true,
    cjsInterop: true,
    outDir: 'dist',
    target: 'es2022', // Node 22 is a superset of ES2022; browser compat is the binding constraint
    ...overrides,
  };
}
