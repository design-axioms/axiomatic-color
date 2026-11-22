# Release Process

Releases in this repository are automated with [release-plan](https://github.com/embroider-build/release-plan) and published to npm via GitHub Actions **Trusted Publishing (OIDC)** with provenance (no `NPM_TOKEN` secret).

## Alpha Prerelease Channel

While v2 is in alpha, both `@design-axioms/color` and `@design-axioms/color-cli` carry a `release-plan` block in their `package.json` files mapping `major`, `minor`, and `patch` PR impacts to `prerelease` (`0.1.0-alpha.N`) under the `alpha` npm dist-tag.

- `@design-axioms/color-vscode` is marked `"private": true` and is excluded from npm releases.
- To graduate to stable `0.1.0` later, remove the `"release-plan"` block from `packages/core/package.json` and `packages/cli/package.json` and drop `--github-prerelease` from `.github/workflows/publish.yml`.

## Day-to-Day Releasing

1. Label every PR merged into `main` with one of:
   - `breaking` — breaking change
   - `enhancement` — new feature or enhancement
   - `bug` — bug fix
   - `documentation` — documentation-only update
   - `internal` — internal tooling, CI, or housekeeping
2. `.github/workflows/plan-release.yml` automatically opens/updates a **Prepare Release** PR (`release-preview` branch) updating `CHANGELOG.md`, bumping package versions, and writing `.release-plan.json`.
3. Because `main` requires the `Test` check and `plan-release.yml` uses `GITHUB_TOKEN`, close and reopen the **Prepare Release** PR once if `Test` hasn't triggered automatically.
4. Merge the **Prepare Release** PR. `.github/workflows/publish.yml` detects the updated `.release-plan.json` on `main`, builds the packages, tags the release, creates a GitHub Pre-release, and publishes to npm via Trusted Publishing.

## npm Trusted Publishing Configuration

Each published package on `npmjs.com` (`@design-axioms/color` and `@design-axioms/color-cli`) must register a GitHub Actions Trusted Publisher under **Settings → Trusted Publisher**:

- **Organization or user**: `design-axioms`
- **Repository**: `axiomatic-color`
- **Workflow filename**: `publish.yml`
- **Environment name**: _(leave blank)_
