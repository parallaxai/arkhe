# Contributing to @acme

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this monorepo.

## Prerequisites

- **Node.js** >= 22.12.0 (check with `node -v`)
- **pnpm** 10.x (installed automatically via `corepack enable`)

## Getting Started

1. Fork and clone the repository
2. Run `corepack enable` to activate pnpm
3. Run `pnpm install` to install dependencies
4. Run `pnpm build` to build all packages
5. Run `pnpm test` to verify everything works

## Development Workflow

1. Create a feature branch from `main`:
   ```sh
   git checkout -b feat/my-feature
   ```
2. Make your changes
3. Add a changeset if your changes affect a published package:
   ```sh
   pnpm changeset
   ```
4. Commit using [Conventional Commits](https://www.conventionalcommits.org/) format:
   ```sh
   git commit -m "feat(acme): add string helper"
   ```
5. Push your branch and open a pull request against `main`

## Commit Messages

All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This is enforced by commitlint via a git hook.

Format: `type(scope): description`

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `perf`, `build`, `style`, `revert`

Scopes (optional): `acme`, `docs`, `config`, `ci`

## Changesets

If your PR changes any published package (`acme`), you must include a changeset:

```sh
pnpm changeset
```

This will prompt you to select affected packages and describe the change. The changeset file is committed with your PR and used later to automate versioning and changelog generation.

## Scripts

| Command | Description |
|---|---|
| `pnpm build` | Build all packages |
| `pnpm test` | Run tests |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm lint` | Lint and format check |
| `pnpm lint:fix` | Lint with auto-fix |
| `pnpm typecheck` | Type-check all packages |
| `pnpm knip` | Check for dead code |

## Code Style

- Formatting and linting are handled by [Biome](https://biomejs.dev/) — no Prettier or ESLint config needed
- Format-on-save is configured in `.vscode/settings.json`
- Pre-commit hooks run Biome on staged files automatically

## Pull Requests

- Fill out the PR template completely
- Ensure CI passes (lint, typecheck, tests, build, export validation)
- Include a changeset if applicable
- Keep PRs focused — one feature or fix per PR
