#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { accessSync } from 'node:fs';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';

const root = resolve(import.meta.dirname, '..');

const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

async function ask(rl, question, validate) {
  while (true) {
    const answer = (await rl.question(question)).trim();
    const error = validate(answer);
    if (!error) return answer;
    console.log(`  ${red(error)}`);
  }
}

// Read scope from root package.json
const rootPkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const scopeMatch = rootPkg.name?.match(/^@([^/]+)\//);
if (!scopeMatch) {
  console.log(
    red('\nCould not detect scope from root package.json. Expected "@scope/name" format.\n'),
  );
  process.exit(1);
}
const scope = scopeMatch[1];

// Read repository URL from root package.json
const repoUrl = rootPkg.repository?.url?.replace(/\.git$/, '');

// Read devDependency versions from an existing package to stay in sync
let refVersions = {};
const { readdirSync } = await import('node:fs');
for (const dir of readdirSync(resolve(root, 'packages'))) {
  try {
    const pkg = JSON.parse(await readFile(resolve(root, 'packages', dir, 'package.json'), 'utf8'));
    if (!pkg.private && pkg.devDependencies) {
      refVersions = pkg.devDependencies;
      break;
    }
  } catch {}
}

try {
  console.log(`\n${bold('New Package')}`);
  console.log(dim(`Scope: @${scope}\n`));

  const rl = createInterface({ input: stdin, output: stdout });

  const name = await ask(
    rl,
    `${bold('Package name')} ${dim('(lowercase, e.g. "utils")')}: `,
    (v) => {
      if (!v) return 'Name is required.';
      if (!/^[a-z][a-z0-9-]*$/.test(v))
        return 'Must be lowercase, start with a letter, and contain only a-z, 0-9, or hyphens.';
      return null;
    },
  );

  rl.close();

  const pkgDir = resolve(root, 'packages', name);

  // Check if directory already exists
  try {
    accessSync(pkgDir);
    console.log(red(`\npackages/${name} already exists. Aborting.\n`));
    process.exit(1);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  console.log(`\n${dim('Creating')} packages/${name}${dim('...')}\n`);

  // Save original tsconfig so we can revert on failure
  const tsconfigPath = resolve(root, 'tsconfig.json');
  const originalTsconfig = await readFile(tsconfigPath, 'utf8');

  try {
    // Create directories
    await mkdir(resolve(pkgDir, 'src'), { recursive: true });
    await mkdir(resolve(pkgDir, '__tests__'), { recursive: true });

    // package.json
    const pkg = {
      name: `@${scope}/${name}`,
      version: '0.0.0',
      description: '',
      license: 'MIT',
      keywords: [],
      ...(repoUrl && {
        repository: { type: 'git', url: `${repoUrl}.git`, directory: `packages/${name}` },
        bugs: { url: `${repoUrl}/issues` },
        homepage: `${repoUrl}#readme`,
      }),
      type: 'module',
      main: './dist/index.cjs',
      module: './dist/index.js',
      types: './dist/index.d.ts',
      exports: {
        '.': {
          import: {
            types: './dist/index.d.ts',
            default: './dist/index.js',
          },
          require: {
            types: './dist/index.d.cts',
            default: './dist/index.cjs',
          },
        },
      },
      files: ['dist'],
      sideEffects: false,
      scripts: {
        build: 'tsup',
        'check-exports': 'attw --pack && publint',
        clean: 'rm -rf dist .turbo coverage tsconfig.tsbuildinfo',
        dev: 'tsup --watch',
        test: 'vitest run --typecheck',
        'test:coverage': 'vitest run --typecheck --coverage',
        'test:watch': 'vitest',
        typecheck: 'tsc --noEmit',
      },
      devDependencies: {
        [`@${scope}/config`]: 'workspace:*',
        '@arethetypeswrong/cli': refVersions['@arethetypeswrong/cli'] || '0.18.2',
        '@vitest/coverage-v8': refVersions['@vitest/coverage-v8'] || '4.1.2',
        publint: refVersions.publint || '0.3.18',
        tsup: refVersions.tsup || '8.5.1',
        vitest: refVersions.vitest || '4.1.2',
      },
    };
    await writeFile(resolve(pkgDir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');

    // tsconfig.json
    await writeFile(
      resolve(pkgDir, 'tsconfig.json'),
      JSON.stringify(
        {
          extends: `@${scope}/config/tsconfig/library.json`,
          compilerOptions: { outDir: 'dist', rootDir: 'src' },
          include: ['src'],
        },
        null,
        2,
      ) + '\n',
    );

    // tsup.config.ts
    await writeFile(
      resolve(pkgDir, 'tsup.config.ts'),
      `import { createTsupConfig } from '@${scope}/config/tsup.config.base';\nimport { defineConfig } from 'tsup';\n\nexport default defineConfig(createTsupConfig());\n`,
    );

    // vitest.config.ts
    await writeFile(
      resolve(pkgDir, 'vitest.config.ts'),
      `import { createVitestConfig } from '@${scope}/config/vitest.shared';\n\nexport default createVitestConfig();\n`,
    );

    // README.md
    await writeFile(resolve(pkgDir, 'README.md'), `# @${scope}/${name}\n`);

    // LICENSE (copy from root)
    await copyFile(resolve(root, 'LICENSE'), resolve(pkgDir, 'LICENSE'));

    // src/index.ts
    await writeFile(resolve(pkgDir, 'src/index.ts'), '');

    // __tests__/index.test.ts
    await writeFile(
      resolve(pkgDir, '__tests__/index.test.ts'),
      `import { describe, it, expect } from 'vitest';\n\ndescribe('${name}', () => {\n  it('should work', () => {\n    expect(true).toBe(true);\n  });\n});\n`,
    );

    // Add to root tsconfig references
    const tsconfig = JSON.parse(originalTsconfig);
    const ref = { path: `packages/${name}` };
    if (!tsconfig.references?.some((r) => r.path === ref.path)) {
      tsconfig.references = [...(tsconfig.references || []), ref];
      await writeFile(tsconfigPath, JSON.stringify(tsconfig, null, 2) + '\n');
    }

    // Install dependencies
    console.log(dim('Running pnpm install...\n'));
    execSync('pnpm install', { cwd: root, stdio: 'inherit' });
  } catch (setupErr) {
    console.error(`\n${red('Setup failed, cleaning up...')}`);
    await rm(pkgDir, { recursive: true, force: true }).catch(() => {});
    await writeFile(tsconfigPath, originalTsconfig).catch(() => {});
    throw setupErr;
  }

  console.log(
    `\n${green(bold('Done!'))} Created ${bold(`@${scope}/${name}`)} at ${dim(`packages/${name}`)}`,
  );
  console.log(`\nNext steps:`);
  console.log(`  1. Add your code to ${dim(`packages/${name}/src/index.ts`)}`);
  console.log(`  2. Run ${dim('pnpm build')} to verify`);
  console.log('');
} catch (err) {
  if (err?.code === 'ERR_USE_AFTER_CLOSE') process.exit(0);
  console.error(`\n${red('Failed:')} ${err.message}\n`);
  process.exit(1);
}
