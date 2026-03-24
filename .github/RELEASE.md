# Release Process

This repository uses [Nx Release](https://nx.dev/docs/guides/nx-release/publish-in-ci-cd) with a manually-triggered GitHub Actions workflow for versioning, changelog generation, and npm publishing.

## Prerequisites

### NPM_ACCESS_TOKEN

1. Login to [npmjs.com](https://www.npmjs.com/)
2. Navigate to **"Access Tokens"** > **"Generate New Token"** > **"Granular Access Token"**
3. Configure:
   - **Name**: `GitHub Actions - glean-local-mcp`
   - **Packages and scopes**: Read and Write access to the published packages
4. Copy the token

### Add the secret to GitHub

1. Go to repo **Settings** > **Secrets and variables** > **Actions**
2. Create secret **`NPM_ACCESS_TOKEN`** with the token value

## How to Release

1. Go to **Actions** > **Release** workflow in GitHub
2. Click **"Run workflow"**
3. Optionally enable **dry-run** to preview without publishing
4. Click **"Run workflow"**

The workflow will:
- Bump version numbers based on [conventional commits](https://www.conventionalcommits.org/)
- Update CHANGELOG.md files
- Build the packages
- Publish to npm with provenance
- Push the version commit and tags back to the repository

## Dry Run

Enable the **dry-run** checkbox to run versioning and changelog generation without publishing to npm or pushing changes. Useful for previewing what the next release will look like.

## Version Scheme

[Semantic Versioning](https://semver.org/): MAJOR.MINOR.PATCH based on conventional commit prefixes (`feat:`, `fix:`, `feat!:`/`BREAKING CHANGE:`).

## NPM Provenance

All published packages include [npm provenance](https://docs.npmjs.com/generating-provenance-statements) data for supply-chain security.

## Troubleshooting

### "Authentication failed" in GitHub Actions

- Verify `NPM_ACCESS_TOKEN` secret is set and not expired
- Verify the token has publish permissions for the package

### Publishing fails with "Package not found"

- Ensure the package name in `package.json` is available on npm
- For scoped packages, ensure organization access

## Resources

- [Nx Release Documentation](https://nx.dev/docs/guides/nx-release/publish-in-ci-cd)
- [NPM Provenance](https://docs.npmjs.com/generating-provenance-statements)
- [Conventional Commits](https://www.conventionalcommits.org/)
