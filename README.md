# Glean MCP OAuth Wrapper

[![npm version](https://badge.fury.io/js/glean-local-mcp.svg)](https://www.npmjs.com/package/glean-local-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Monorepo for OAuth-enabled Glean MCP server integration.

**Repository**: [https://github.com/theplenkov-npm/glean-local-mcp](https://github.com/theplenkov-npm/glean-local-mcp)

## What This Is

A lightweight OAuth wrapper that enables AI IDEs (Cursor, etc.) to use Glean with OAuth 2.0 authentication. It manages tokens and proxies to `@gleanwork/local-mcp-server`.

## Components

```
glean-local-mcp-server/
├── packages/
│   └── glean-local-mcp-server/    # OAuth wrapper package
└── docs/                          # Additional documentation
```

### `glean-local-mcp-server`

OAuth wrapper that:
- Handles OAuth 2.0 flow via Okta
- Manages token storage and refresh
- Spawns `@gleanwork/local-mcp-server` with valid tokens
- No external HTTP dependencies (uses native fetch/http)

See [packages/glean-local-mcp-server](./packages/glean-local-mcp-server) for usage.

## Quick Start

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
