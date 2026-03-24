# AGENTS.md

## Project

OAuth wrapper for `@gleanwork/local-mcp-server`. Monorepo with one package at `packages/glean-local-mcp`.

## Build & Verify

```bash
bunx nx run glean:build   # build the package (~84ms via tsdown)
bunx nx run glean:test    # run tests (Node --test runner)
```

## Architecture

```
packages/glean-local-mcp/src/
├── index.ts                   # Main entry: spawns child process with OAuth token
├── auth/
│   ├── config.ts              # Config loading (mcp-config.json + env vars)
│   ├── oauth-handler.ts       # OAuth 2.0 browser flow (native http)
│   └── token-manager.ts       # Token storage & refresh
├── proxy/
│   └── fetch-interceptor.ts   # Fetch interceptor for token injection
├── cli/
│   └── authenticate.ts        # Standalone auth CLI tool
├── types/
│   └── index.ts               # TypeScript type definitions
└── utils/
    └── package-manager-detection.ts  # Detect npx/bunx/pnpm dlx
```

## Key Conventions

- **Config field**: `apiBaseUrl` in types, mcp-config.json, and user-facing docs.
  The upstream child process receives it as `GLEAN_SERVER_URL` env var (that's what `@gleanwork/local-mcp-server` expects).
- **Env vars**: `GLEAN_SERVER_URL`, `GLEAN_CLIENT_ID`, `GLEAN_CLIENT_SECRET`, `OAUTH_ISSUER_URL`.
- **Zero HTTP deps**: uses native Node.js `fetch` and `http` module only.
- **Node.js 24+** required (native TypeScript, native fetch).
- **tsdown** for bundling, **Nx** for monorepo orchestration.

## MCP Client Setup

### With config file (recommended)

Create `~/.glean/mcp-config.json`:
```json
{
  "clientId": "your_client_id",
  "clientSecret": "your_client_secret",
  "issuerUrl": "https://your-company.okta.com",
  "apiBaseUrl": "https://your-company-be.glean.com"
}
```

MCP client config (Cursor, VS Code, Claude Desktop, etc.):
```json
{
  "mcpServers": {
    "glean": {
      "command": "bunx",
      "args": ["glean-local-mcp"]
    }
  }
}
```

### With environment variables

```json
{
  "mcpServers": {
    "glean": {
      "command": "bunx",
      "args": ["glean-local-mcp"],
      "env": {
        "GLEAN_CLIENT_ID": "your_client_id",
        "GLEAN_CLIENT_SECRET": "your_client_secret",
        "OAUTH_ISSUER_URL": "https://your-company.okta.com",
        "GLEAN_SERVER_URL": "https://your-company-be.glean.com"
      }
    }
  }
}
```

On first use, a browser window opens for OAuth login. Tokens are saved to `~/.glean/tokens.json`.

## Troubleshooting

- **"Missing OAuth configuration"** -- check required env vars / mcp-config.json fields
- **"Port already in use"** -- change `OAUTH_PORT` and update `REDIRECT_URI` to match
- **Auth fails** -- delete `~/.glean/tokens.json` and retry
