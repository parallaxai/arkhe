#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { access, readdir, readFile, rename, rm, rmdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';

const root = resolve(import.meta.dirname, '..');

// --- ANSI helpers ---
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

// --- Helpers ---
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

async function ask(rl, question, validate) {
  while (true) {
    const answer = (await rl.question(question)).trim();
    const error = validate(answer);
    if (!error) return answer;
    console.log(`  ${red(error)}`);
  }
}

async function replaceInFile(filePath, replacements) {
  let content = await readFile(filePath, 'utf8');
  const original = content;
  for (const [search, replace] of replacements) {
    content = content.replaceAll(search, replace);
  }
  if (content !== original) {
    await writeFile(filePath, content, 'utf8');
  }
}

// --- Main ---
try {
  // Idempotency guard
  try {
    await access(resolve(root, 'packages/acme'));
  } catch {
    console.log(red('\nSetup already completed (packages/acme not found). Aborting.\n'));
    process.exit(1);
  }

  console.log(`\n${bold('Monorepo Setup')}`);
  console.log(dim('Replaces template placeholders with your project values.\n'));

  const rl = createInterface({ input: stdin, output: stdout });

  // 1. Project name
  const name = await ask(
    rl,
    `${bold('Project name')} ${dim('(lowercase, replaces "acme")')}: `,
    (v) => {
      if (!v) return 'Name is required.';
      if (!/^[a-z][a-z0-9-]*$/.test(v))
        return 'Must be lowercase, start with a letter, and contain only a-z, 0-9, or hyphens.';
      return null;
    },
  );
  const Name = capitalize(name);

  // 2. Code owner
  const owner = await ask(
    rl,
    `${bold('Code owner')} ${dim('(GitHub @username or @org/team)')}: `,
    (v) => {
      if (!v) return 'Code owner is required.';
      if (!v.startsWith('@')) return 'Must start with @.';
      if (!/^@[\w-]+(\/[\w-]+)?$/.test(v)) return 'Invalid format. Use @username or @org/team.';
      return null;
    },
  );
  const githubUser = owner.slice(1).split('/')[0];

  // 3. Copyright holder
  const copyrightHolder = await ask(
    rl,
    `${bold('Copyright holder')} ${dim('(for LICENSE, e.g. "Your Name" or "Your Company Inc.")')}: `,
    (v) => {
      if (!v) return 'Copyright holder is required.';
      return null;
    },
  );

  // 4. GitHub repository
  const repo = await ask(
    rl,
    `${bold('GitHub repository')} ${dim('(owner/repo, e.g. "myorg/mylib")')}: `,
    (v) => {
      if (!v) return 'Repository is required.';
      if (!/^[\w.-]+\/[\w.-]+$/.test(v)) return 'Must be in owner/repo format.';
      return null;
    },
  );

  // 5. CI runner
  console.log(`\n${bold('CI runner')}:`);
  console.log(`  1) GitHub-hosted ${dim('(ubuntu-latest)')}`);
  console.log(`  2) Self-hosted ${dim('(self-hosted)')}`);
  const runnerChoice = await ask(rl, `  Choice ${dim('[1]')}: `, (v) => {
    if (v === '' || v === '1' || v === '2') return null;
    return 'Enter 1 or 2.';
  });
  const runner = runnerChoice === '2' ? 'self-hosted' : 'ubuntu-latest';

  // 6. Release authentication
  console.log(`\n${bold('Release authentication')}:`);
  console.log(`  1) Personal access token ${dim('(PAT_TOKEN secret)')}`);
  console.log(`  2) GitHub App ${dim('(APP_ID + APP_PRIVATE_KEY secrets)')}`);
  const authChoice = await ask(rl, `  Choice ${dim('[1]')}: `, (v) => {
    if (v === '' || v === '1' || v === '2') return null;
    return 'Enter 1 or 2.';
  });
  const useGitHubApp = authChoice === '2';

  // 7. SECURITY.md
  const keepSecurity = await ask(rl, `\n${bold('Keep SECURITY.md?')} ${dim('(y/N)')}: `, (v) => {
    if (/^(y|n|yes|no|)$/i.test(v)) return null;
    return 'Enter y or n.';
  });
  const wantSecurity = /^y(es)?$/i.test(keepSecurity);
  let securityEmail = '';
  if (wantSecurity) {
    securityEmail = await ask(rl, `${bold('Security contact email')}: `, (v) => {
      if (!v) return 'Email is required.';
      if (!v.includes('@')) return 'Must be a valid email address.';
      return null;
    });
  }

  rl.close();

  // Print summary
  console.log(`\n${bold('Applying:')}`);
  console.log(`  Project name:     ${green(name)}`);
  console.log(`  Code owner:       ${green(owner)}`);
  console.log(`  Copyright holder: ${green(copyrightHolder)}`);
  console.log(`  Repository:       ${green(repo)}`);
  console.log(`  CI runner:        ${green(runner)}`);
  console.log(`  Release auth:     ${green(useGitHubApp ? 'GitHub App' : 'PAT token')}`);
  console.log(
    `  SECURITY.md:      ${green(wantSecurity ? `keep (${securityEmail})` : 'remove')}\n`,
  );

  // --- Target file lists ---
  const repoFiles = [
    'package.json',
    'packages/acme/package.json',
    'apps/docs/lib/layout.shared.tsx',
    '.changeset/config.json',
  ];

  const nameFiles = [
    'package.json',
    'tsconfig.json',
    'README.md',
    'CONTRIBUTING.md',
    'CODEOWNERS',
    '.syncpackrc.json',
    'packages/acme/package.json',
    'packages/acme/tsconfig.json',
    'packages/acme/tsup.config.ts',
    'packages/acme/vitest.config.ts',
    'packages/acme/README.md',
    'packages/config/package.json',
    'apps/docs/package.json',
    'apps/docs/tsconfig.json',
    'apps/docs/app/layout.tsx',
    'apps/docs/lib/layout.shared.tsx',
    '.github/ISSUE_TEMPLATE/bug_report.yml',
    '.github/ISSUE_TEMPLATE/feature_request.yml',
    '.github/ISSUE_TEMPLATE/config.yml',
    '.github/workflows/ci.yml',
  ];

  const workflowFiles = [
    '.github/workflows/ci.yml',
    '.github/workflows/codeql.yml',
    '.github/workflows/dependabot-auto-merge.yml',
    '.github/workflows/labeler.yml',
    '.github/workflows/release.yml',
  ];

  // --- Pre-flight: verify all target files exist before mutations ---
  const allTargetFiles = new Set([
    ...repoFiles,
    ...nameFiles,
    ...workflowFiles,
    'LICENSE',
    'packages/acme/LICENSE',
    'SECURITY.md',
  ]);

  const missing = [];
  for (const file of allTargetFiles) {
    try {
      await access(resolve(root, file));
    } catch {
      missing.push(file);
    }
  }
  if (missing.length > 0) {
    console.log(red('\nPre-flight check failed. Missing files:'));
    for (const f of missing) console.log(`  - ${f}`);
    console.log(red('\nAborting — no files were modified.\n'));
    process.exit(1);
  }

  // --- Apply repository URL replacements (before name replacements to avoid partial matches) ---
  const repoReplacements = [['AcmeOrg/acme', repo]];
  for (const file of repoFiles) {
    await replaceInFile(resolve(root, file), repoReplacements);
  }

  // --- Apply name replacements ---
  const nameReplacements = [
    ['@acme/', `@${name}/`],
    ['AcmeOrg', githubUser],
    ['Acme', Name],
    ['acme', name],
  ];

  for (const file of nameFiles) {
    await replaceInFile(resolve(root, file), nameReplacements);
  }

  // --- CODEOWNERS: replace <owner> placeholder ---
  await replaceInFile(resolve(root, 'CODEOWNERS'), [['<owner>', owner]]);

  // --- LICENSE: replace copyright holder ---
  await replaceInFile(resolve(root, 'LICENSE'), [['Acme', copyrightHolder]]);
  await replaceInFile(resolve(root, 'packages/acme/LICENSE'), [['Acme', copyrightHolder]]);

  // --- CI runner replacement ---
  if (runner === 'ubuntu-latest') {
    for (const file of workflowFiles) {
      await replaceInFile(resolve(root, file), [['runs-on: self-hosted', `runs-on: ${runner}`]]);
    }
  }

  // --- Release authentication ---
  if (useGitHubApp) {
    const releaseYml = resolve(root, '.github/workflows/release.yml');
    let content = await readFile(releaseYml, 'utf8');
    content = content.replace(
      `    steps:
      - uses: actions/checkout@v6
        with:
          token: \${{ secrets.PAT_TOKEN }}`,
      `    steps:
      - name: Generate token
        id: app-token
        uses: actions/create-github-app-token@v2
        with:
          app-id: \${{ secrets.APP_ID }}
          private-key: \${{ secrets.APP_PRIVATE_KEY }}

      - uses: actions/checkout@v6
        with:
          token: \${{ steps.app-token.outputs.token }}`,
    );
    content = content.replace(
      `          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}`,
      `          GITHUB_TOKEN: \${{ steps.app-token.outputs.token }}`,
    );
    await writeFile(releaseYml, content, 'utf8');

    // Update README secrets table
    await replaceInFile(resolve(root, 'README.md'), [
      [
        '| `NPM_TOKEN` | npm access token for publishing packages |\n| `PAT_TOKEN` | Personal access token — allows release commits to trigger CI workflows |',
        '| `NPM_TOKEN` | npm access token for publishing packages |\n| `APP_ID` | GitHub App ID — used to generate tokens for release commits |\n| `APP_PRIVATE_KEY` | GitHub App private key (`.pem` file contents including BEGIN/END lines) |',
      ],
    ]);
  }

  // --- SECURITY.md ---
  if (wantSecurity) {
    await replaceInFile(resolve(root, 'SECURITY.md'), [['security@acme.dev', securityEmail]]);
  } else {
    await rm(resolve(root, 'SECURITY.md'));
  }

  // --- Rename packages/acme → packages/<name> ---
  await rename(resolve(root, 'packages/acme'), resolve(root, `packages/${name}`));

  // --- Self-cleanup ---
  await rm(resolve(root, 'scripts/setup.mjs'));
  const remaining = await readdir(resolve(root, 'scripts'));
  if (remaining.length === 0) {
    await rmdir(resolve(root, 'scripts'));
  }

  // --- Regenerate lockfile ---
  console.log(dim('Running pnpm install...\n'));
  execSync('pnpm install', { cwd: root, stdio: 'inherit' });

  console.log(`\n${green(bold('Setup complete!'))} Run ${dim('pnpm build')} to verify.\n`);
} catch (err) {
  if (err?.code === 'ERR_USE_AFTER_CLOSE') process.exit(0);
  console.error(`\n${red('Setup failed:')} ${err.message}\n`);
  process.exit(1);
}
