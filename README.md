# @arkhe/monorepo

TypeScript library monorepo template using pnpm workspaces, Turborepo, tsup, Vitest, Biome, Changesets, GitHub Actions, and Fumadocs.

## What's Included

- **pnpm workspaces** — monorepo package management
- **Turborepo** — task orchestration with caching
- **tsup** — dual CJS + ESM builds with TypeScript declarations
- **Vitest** — unit testing with v8 coverage
- **Biome** — linting and formatting
- **Changesets** — versioning, changelogs, and automated npm publishing
- **GitHub Actions** — CI, CodeQL security analysis, auto-labeling, and releases
- **Fumadocs** — documentation site with Next.js and MDX
- **Husky** — git hooks for pre-commit linting and pre-push build validation
- **Commitlint** — enforces Conventional Commits
- **Syncpack** — dependency version consistency across packages
- **Knip** — detects unused code, exports, and dependencies

## Architecture

```
packages/
  config/     @arkhe/config  — shared tsconfig, tsup, vitest configs (private)
  arkhe/       arkhe    — core library (publishable)
apps/
  docs/       @arkhe/docs    — documentation site (Fumadocs + Next.js)
scripts/
  setup.mjs                 — one-time template setup
  new-package.mjs           — scaffold a new package
```

All publishable packages ship dual CJS + ESM exports with TypeScript declarations.

## Getting Started

### Prerequisites

- **Node.js** >= 22.12.0
- **Corepack** enabled (ships with Node.js)

### Initial Setup

```sh
corepack enable
pnpm install
pnpm build
pnpm test
```

### Template Setup

After cloning the template, run the interactive setup script to replace all placeholders:

```sh
node scripts/setup.mjs
```

It will prompt for:

1. **Project name** — replaces `arkhe` across all files and renames `packages/arkhe/`
2. **Code owner** — sets up `CODEOWNERS` with your GitHub username or org/team
3. **CI runner** — choose between GitHub-hosted (`ubuntu-latest`) or self-hosted
4. **Release authentication** — choose between a Personal Access Token (`PAT_TOKEN`) or a GitHub App (`APP_ID` + `APP_PRIVATE_KEY`)
5. **SECURITY.md** — keep it (with your security contact email) or remove it

The script self-deletes after running.

## Package Management

This monorepo uses [pnpm](https://pnpm.io/) with workspaces. Corepack ensures everyone uses the same pnpm version (defined in the root `packageManager` field).

Workspace packages are defined in `pnpm-workspace.yaml`:

```yaml
packages:
  - packages/*
  - apps/*
```

### Common Commands

```sh
# Install all dependencies
pnpm install

# Add a dependency to a specific package
pnpm --filter arkhe add zod

# Remove a dependency from a specific package
pnpm --filter arkhe remove zod

# Add a root dev dependency
pnpm -w add -D <package>

# Run a script in a specific package
pnpm --filter arkhe test
```

Internal packages reference each other using the `workspace:*` protocol:

```json
{
  "devDependencies": {
    "@arkhe/config": "workspace:*"
  }
}
```

## Scripts

| Command | Description |
|---|---|
| `pnpm build` | Build all packages and apps |
| `pnpm dev` | Start all in watch mode |
| `pnpm test` | Run tests across workspace |
| `pnpm test:coverage` | Tests with v8 coverage |
| `pnpm typecheck` | Type-check all packages |
| `pnpm lint` | Lint and format check (Biome) |
| `pnpm lint:fix` | Lint with auto-fix |
| `pnpm format` | Format all files |
| `pnpm knip` | Detect dead code, exports, and dependencies |
| `pnpm syncpack:check` | Check dependency version consistency |
| `pnpm changeset` | Create a new changeset |
| `pnpm check-exports` | Validate CJS/ESM exports |
| `pnpm clean` | Clean all build artifacts |

### Utility Scripts

| Command | Description |
|---|---|
| `node scripts/setup.mjs` | One-time template setup (replaces placeholders) |
| `node scripts/new-package.mjs` | Scaffold a new publishable package |

## Creating a New Package

```sh
node scripts/new-package.mjs
```

This interactive script scaffolds a new publishable package with:

- Correct `package.json` with dual CJS/ESM exports
- tsup, vitest, and tsconfig extending shared configs
- Dependency versions matching existing packages
- Automatic `pnpm install` and root tsconfig update

## Platform Targeting

### Node-only packages

- Node built-in imports (`node:fs`, `node:path`, etc.) are auto-externalized by tsup
- Install `@types/node` as a devDependency
- Keep `lib: ["ES2022"]` (no DOM types)
- Add `"engines": { "node": ">=[minimum version]" }` to `package.json`

### Browser-only packages

- Add `platform: 'browser'` to the tsup config override
- Add `"lib": ["ES2022", "DOM", "DOM.Iterable"]` to the package's tsconfig
- Do **not** install `@types/node`
- **Omit** the `engines` field from `package.json`
- Use `happy-dom` test environment for DOM-interacting tests

### Packages targeting both Node and Browser

- Use the default config (no `platform` override, no DOM in `lib`)
- Do **not** import Node built-ins
- Only use APIs available in both environments (anything in `ES2022`)
- **Omit** the `engines` field from `package.json`

## Releasing

This project uses [Changesets](https://github.com/changesets/changesets) for versioning and publishing.

### 1. Add a changeset during development

```sh
pnpm changeset
```

Select the affected packages, choose the semver bump type (patch/minor/major), and describe the change. This creates a markdown file in `.changeset/` that you commit with your PR.

### 2. Merge your PR to main

The release workflow detects the changeset files and automatically creates (or updates) a **"Version Packages"** PR. This PR bumps versions, updates changelogs, and removes the changeset files.

### 3. Accumulate changes

More PRs with changesets can merge to `main`. The "Version Packages" PR auto-updates to include all pending changes.

### 4. Release

When you're ready to publish, merge the "Version Packages" PR. This triggers the release workflow which builds all packages and publishes them to npm with provenance attestation.

```
PR #1 (feat + changeset) -> merge -> "Version Packages" PR created
PR #2 (fix + changeset)  -> merge -> "Version Packages" PR updated
                                            |
                                  You merge it when ready
                                            |
                                   Packages published to npm
```

## GitHub Setup

### Required Secrets

Configure these in **Settings > Secrets and variables > Actions**:

| Secret | Purpose |
|---|---|
| `NPM_TOKEN` | npm access token for publishing packages |
| `APP_ID` | GitHub App ID — used to generate tokens for release commits |
| `APP_PRIVATE_KEY` | GitHub App private key (`.pem` file contents including BEGIN/END lines) |

The release workflow will fail if the required secrets are not configured.

### Branch Protection

See [`.github/BRANCH_PROTECTION.md`](.github/BRANCH_PROTECTION.md) for recommended branch protection rules.

Key settings:

- Require pull requests with 1 approval
- Require status checks to pass (`CI (Node 22)`, `CI (Node 24)`)
- Require code owner approval (uses `CODEOWNERS`)
- Require branches to be up to date before merging

### CI Pipeline

The CI workflow runs on every push to `main` and every PR, testing against Node 22 and 24:

1. **Security audit** — checks dependencies for known vulnerabilities
2. **Lint & format** — Biome checks
3. **Dependency consistency** — syncpack verifies versions match across packages
4. **Unused code** — knip detects dead code, exports, and dependencies
5. **Type check** — `tsc --noEmit` across all packages
6. **Tests with coverage** — Vitest with v8 coverage
7. **Build** — tsup compilation
8. **Export validation** — attw + publint verify CJS/ESM exports resolve correctly
9. **Package verification** — `npm pack --dry-run` shows what would be published

### Additional Workflows

- **CodeQL** — security analysis on public repos (runs on PRs and weekly)
- **Labeler** — auto-labels PRs based on changed files (packages, docs, ci, config, dependencies)
- **Release** — Changesets-driven versioning and npm publishing

## Git Hooks

Managed by [Husky](https://typicode.github.io/husky/).

- **pre-commit** — runs Biome via lint-staged on all staged files
- **pre-push** — builds the monorepo and warns if publishable packages were changed without a changeset
- **commit-msg** — validates commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)

## Code Quality Tools

| Tool | Purpose |
|---|---|
| [Biome](https://biomejs.dev/) | Linting and formatting (replaces ESLint + Prettier) |
| [Commitlint](https://commitlint.js.org/) | Enforces Conventional Commits format |
| [Syncpack](https://jamiemason.github.io/syncpack/) | Ensures consistent dependency versions across packages |
| [Knip](https://knip.dev/) | Detects unused files, exports, dependencies, and types |
| [attw](https://arethetypeswrong.github.io/) | Validates TypeScript types resolve correctly for CJS/ESM consumers |
| [publint](https://publint.dev/) | Checks package.json for common publishing mistakes |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, workflow, and pull request guidelines.

## License

[MIT](LICENSE)
