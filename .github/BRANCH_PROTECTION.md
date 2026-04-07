# Branch Protection Rules

Recommended branch protection settings for the `main` branch. Configure these in **Settings > Branches > Branch protection rules**.

## Rules for `main`

- [x] **Require a pull request before merging**
  - [x] Require approvals: 1
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require review from code owners
- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - Required checks:
    - `CI (Node 22)`
    - `CI (Node 24)`
- [x] **Require conversation resolution before merging**
- [x] **Require linear history** (enforces squash or rebase merging, no merge commits)
- [ ] **Require signed commits** (optional — enable if your team uses GPG/SSH signing)
- [x] **Do not allow bypassing the above settings** (applies to admins too)

## Notes

- These rules are configured manually in the GitHub UI, not via code
- During initial repository setup, the creator may push directly to `main` before enabling protection
- The release workflow uses `GITHUB_TOKEN` which has push access even with protection enabled
