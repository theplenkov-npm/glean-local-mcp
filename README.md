# Glean MCP OAuth Wrapper

> [!IMPORTANT]
> This repository and its packages are deprecated / no longer maintained.
>
> Do not use `@theplenkov-npm/glean-local-mcp` for new MCP setups. It wraps `@gleanwork/local-mcp-server` which predates Glean's managed remote MCP server and is no longer the supported path for connecting MCP-compatible hosts to Glean.

## What to use instead

Use the managed Glean MCP server built into your Glean instance:

- [Using the Glean MCP Server](https://docs.glean.com/user-guide/mcp/usage) — end-user setup for supported MCP hosts.
- [Set up Glean MCP server](https://docs.glean.com/administration/platform/mcp/enable-mcp-servers) — admin setup and enablement.
- [About Glean MCP server](https://docs.glean.com/administration/platform/mcp/about) — overview of Glean's managed MCP server.

For local command-line workflows, use [Glean CLI](https://github.com/gleanwork/glean-cli) instead of this local MCP server.

## Repository status

This repository is retained for historical reference only. No new feature work or bug fixes are planned here.

The local packages in this repository should not be used for new installations. Published user-facing packages are being retired in favor of the managed Glean MCP server.

---

[![npm version](https://badge.fury.io/js/glean-local-mcp.svg)](https://www.npmjs.com/package/glean-local-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Monorepo for OAuth-enabled Glean MCP server integration.

**Repository**: [https://github.com/theplenkov-npm/glean-local-mcp](https://github.com/theplenkov-npm/glean-local-mcp)

## What This Was (Historical)

A lightweight OAuth wrapper that enabled AI IDEs (Cursor, etc.) to use Glean with OAuth 2.0 authentication. It managed tokens and proxied to `@gleanwork/local-mcp-server`.

## Components

```
glean-local-mcp-server/
├── packages/
│   └── glean-local-mcp-server/    # OAuth wrapper package
└── docs/                          # Additional documentation
```

### `glean-local-mcp-server`

OAuth wrapper that:
- Handled OAuth 2.0 flow via Okta
- Managed token storage and refresh
- Spawned `@gleanwork/local-mcp-server` with valid tokens
- No external HTTP dependencies (uses native fetch/http)

See [packages/glean-local-mcp-server](./packages/glean-local-mcp-server) for historical reference.

## Quick Start (Historical)

```bash
# Install dependencies
bun install

# Build the package
bunx nx run glean:build

# Link for local use
bun link -w glean-local-mcp-server
```

## Development

```bash
# Build all packages
bunx nx run-many -t build

# Run tests
bunx nx run-many -t test

# Clean build artifacts
bunx nx run-many -t clean
```

## Tech Stack

- **Node.js 24+** - Native TypeScript support
- **Bun** - Package manager and task runner
- **tsdown** - Fast TypeScript bundler
- **Nx** - Monorepo management
- **Native Node APIs** - fetch, http (zero dependencies)

## Contributing

1. Fork the [repository](https://github.com/theplenkov-npm/glean-local-mcp)
2. Create a feature branch
3. Make your changes
4. Build and test: `bunx nx run-many -t build test`
5. Submit a [pull request](https://github.com/theplenkov-npm/glean-local-mcp/pulls)

## Issues & Support

- [Report bugs](https://github.com/theplenkov-npm/glean-local-mcp/issues)
- [Request features](https://github.com/theplenkov-npm/glean-local-mcp/issues)

## License

MIT - See [LICENSE](https://github.com/theplenkov-npm/glean-local-mcp/blob/main/LICENSE) for details.
