## 1.4.0 (2026-03-24)

### 🚀 Features

- update release process and CI workflows to use Bun, remove deprecated publish workflow ([0fd17e4](https://github.com/theplenkov-npm/glean-local-mcp/commit/0fd17e4))
- update migration versions and add new migrations for gitignore and analytics prompt ([d1f0455](https://github.com/theplenkov-npm/glean-local-mcp/commit/d1f0455))
- detect and use the same package manager that invoked the wrapper ([7c62cdf](https://github.com/theplenkov-npm/glean-local-mcp/commit/7c62cdf))
- enhance nx.json and package.json for versioning and repository details ([32ff9ef](https://github.com/theplenkov-npm/glean-local-mcp/commit/32ff9ef))
- update nx configuration and CI workflows ([2d3bd91](https://github.com/theplenkov-npm/glean-local-mcp/commit/2d3bd91))
- enhance project.json with caching and inputs for build, watch, and test commands ([23111ca](https://github.com/theplenkov-npm/glean-local-mcp/commit/23111ca))
- **nx-cloud:** setup nx cloud workspace ([9eb5c8b](https://github.com/theplenkov-npm/glean-local-mcp/commit/9eb5c8b))
- add Nx Release with CI/CD publishing setup ([f812827](https://github.com/theplenkov-npm/glean-local-mcp/commit/f812827))
- initial commit - glean-local-mcp OAuth wrapper ([97f217d](https://github.com/theplenkov-npm/glean-local-mcp/commit/97f217d))

### 🩹 Fixes

- simplify release to nx release --skip-publish + git push ([5f7e66c](https://github.com/theplenkov-npm/glean-local-mcp/commit/5f7e66c))
- split nx release into version + changelog subcommands ([91cbea7](https://github.com/theplenkov-npm/glean-local-mcp/commit/91cbea7))
- split release into bun versioning + npm publish for OIDC ([49674bd](https://github.com/theplenkov-npm/glean-local-mcp/commit/49674bd))
- update release command to use npx and ensure NPM_CONFIG_PROVENANCE is set ([8e62c4a](https://github.com/theplenkov-npm/glean-local-mcp/commit/8e62c4a))
- correct bin path and switch to OIDC trusted publishing ([8844b8a](https://github.com/theplenkov-npm/glean-local-mcp/commit/8844b8a))
- remove NODE_AUTH_TOKEN and NPM_CONFIG_PROVENANCE from release job environment ([d070b7a](https://github.com/theplenkov-npm/glean-local-mcp/commit/d070b7a))
- add fallbackCurrentVersionResolver to release version configuration ([f7f8961](https://github.com/theplenkov-npm/glean-local-mcp/commit/f7f8961))
- update release workflow inputs and streamline release steps for improved clarity ([ae03ecf](https://github.com/theplenkov-npm/glean-local-mcp/commit/ae03ecf))
- update release workflow and nx configuration for improved dry-run handling and git push support ([5b5ecf4](https://github.com/theplenkov-npm/glean-local-mcp/commit/5b5ecf4))
- add bun.lock to .nxignore for proper exclusion ([bd6c96b](https://github.com/theplenkov-npm/glean-local-mcp/commit/bd6c96b))
- update dependency versions in package.json for consistency ([4f94e44](https://github.com/theplenkov-npm/glean-local-mcp/commit/4f94e44))
- update README to reflect correct command for local MCP ([7545a79](https://github.com/theplenkov-npm/glean-local-mcp/commit/7545a79))

### ❤️ Thank You

- Devin @devin-ai-integration[bot]
- Petr Plenkov

## 1.3.2 (2026-03-24)

### 🩹 Fixes

- update dependency versions in package.json for consistency ([b8f0ed9](https://github.com/ThePlenkov/glean-local-mcp-server/commit/b8f0ed9))

### ❤️ Thank You

- Petr Plenkov

## 1.3.1 (2025-12-07)

### 🩹 Fixes

- upgrade all packages to latest versions

### ❤️ Thank You

- Petr Plenkov

## 1.3.0 (2025-12-07)

### 🚀 Features

- detect and use the same package manager that invoked the wrapper ([#new](https://github.com/theplenkov-npm/glean-local-mcp/pull/new))
  - Respects user's choice of `npx`, `bunx`, or `pnpm dlx`
  - Improves consistency and performance by leveraging the user's preferred package manager

### ❤️ Thank You

- Petr Plenkov

## 1.2.2 (2025-10-24)

This was a version bump only for glean to align it with other projects, there were no code changes.

## 1.3.0 (2025-10-24)

This was a version bump only for glean to align it with other projects, there were no code changes.

## 1.2.1 (2025-10-24)

### 🩹 Fixes

- update README to reflect correct command for local MCP ([c0b1ea6](https://github.com/theplenkov-npm/glean-local-mcp/commit/c0b1ea6))

### ❤️ Thank You

- Petr Plenkov

## 1.2.0 (2025-10-24)

### 🚀 Features

- enhance nx.json and package.json for versioning and repository details ([1d5e0a1](https://github.com/theplenkov-npm/glean-local-mcp/commit/1d5e0a1))

### ❤️ Thank You

- Petr Plenkov

## 1.1.0 (2025-10-24)

### 🚀 Features

- update nx configuration and CI workflows ([8619a6c](https://github.com/theplenkov-npm/glean-local-mcp/commit/8619a6c))
- enhance project.json with caching and inputs for build, watch, and test commands ([3a74aa0](https://github.com/theplenkov-npm/glean-local-mcp/commit/3a74aa0))
- **nx-cloud:** setup nx cloud workspace ([5e1f74f](https://github.com/theplenkov-npm/glean-local-mcp/commit/5e1f74f))
- add Nx Release with CI/CD publishing setup ([e34339d](https://github.com/theplenkov-npm/glean-local-mcp/commit/e34339d))
- initial commit - glean-local-mcp OAuth wrapper ([22dc477](https://github.com/theplenkov-npm/glean-local-mcp/commit/22dc477))

### ❤️ Thank You

- Petr Plenkov
