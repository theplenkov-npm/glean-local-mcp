# Release Process

This repository uses [Nx Release](https://nx.dev/docs/guides/nx-release/publish-in-ci-cd) for automated versioning and publishing to npm.

## Prerequisites

Before you can publish packages, you need to configure the `NPM_ACCESS_TOKEN` secret in GitHub.

### Generate a NODE_AUTH_TOKEN for NPM

1. Login to [npmjs.com](https://www.npmjs.com/)
2. Click on your profile icon and navigate to **"Access Tokens"**
3. Click **"Generate New Token"** > **"Granular Access Token"**
4. Configure the token:
   - **Name**: Give it a descriptive name (e.g., "GitHub Actions - glean-local-mcp")
   - **Expiration**: Set according to your security policy
   - **Packages and scopes**: 
     - Select the packages you want to publish
     - Grant **Read and Write** access to both the packages and their organization (if applicable)
5. Click **"Generate Token"**
6. **Copy the token** - you won't be able to see it again!

### Add the NPM_ACCESS_TOKEN to GitHub Secrets

1. Navigate to your GitHub repository
2. Go to **Settings** > **Secrets and variables** > **Actions**
3. Click **"New repository secret"**
4. Add:
   - **Name**: `NPM_ACCESS_TOKEN`
   - **Value**: Paste the token you copied from npmjs.com
5. Click **"Add secret"**

## How to Release

### Automatic Release (Recommended)

1. **Run the release command locally** (without publishing):
   ```bash
   npx nx release --skip-publish
   ```
   This will:
   - Bump version numbers based on conventional commits
   - Update CHANGELOG.md files
   - Create a git commit with the changes
   - Create a git tag (e.g., `v1.0.1`)

2. **Push the changes and tags**:
   ```bash
   git push && git push --tags
   ```

3. **GitHub Actions will automatically**:
   - Detect the new tag
   - Run the publish workflow
   - Build the packages
   - Publish to npm with provenance

### Manual Release

If you need to publish manually:

```bash
# Set your npm token
export NODE_AUTH_TOKEN=your_npm_token_here

# Run the full release process
npx nx release
```

## Release Workflow

The automated release process works as follows:

1. **Developer** runs `nx release --skip-publish` locally
2. **Developer** pushes the version commit and tag
3. **GitHub Actions** detects the new tag (`v*.*.*`)
4. **CI Pipeline**:
   - Checks out the code
   - Installs dependencies
   - Builds the packages
   - Publishes to npm with provenance

## Version Scheme

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

## NPM Provenance

All published packages include [npm provenance](https://docs.npmjs.com/generating-provenance-statements) data, which provides:

- Verification of the package source
- Transparency about the build process
- Enhanced security and trust

## Troubleshooting

### "Permission denied" when pushing tags

Make sure the remote is set to HTTPS:
```bash
git remote set-url origin https://github.com/theplenkov-npm/glean-local-mcp.git
```

### "Authentication failed" in GitHub Actions

Check that:
1. The `NPM_ACCESS_TOKEN` secret is correctly set in GitHub
2. The token has the necessary permissions for your packages
3. The token hasn't expired

### Publishing fails with "Package not found"

Ensure:
1. The package name in `package.json` is available on npm
2. You have permission to publish to that package name
3. For scoped packages (e.g., `@myorg/package`), you have access to the organization

## Resources

- [Nx Release Documentation](https://nx.dev/docs/guides/nx-release/publish-in-ci-cd)
- [NPM Provenance](https://docs.npmjs.com/generating-provenance-statements)
- [Conventional Commits](https://www.conventionalcommits.org/)

