# Development Guide

## Setup

```bash
bun install
```

## Build

```bash
bunx nx run glean:build
```

Uses `tsdown` for fast bundling (~84ms).

## Development

```bash
bunx nx run glean:dev
```

Builds and runs the wrapper locally.

## Login (OAuth + Glean CLI sync)

```bash
bunx nx run glean:login
# or directly:
node dist/index.mjs login
```

Performs OAuth, saves tokens for glean-local-mcp, and seeds them into the Glean CLI's storage so `glean auth status` works too.

## Project Structure

```
src/
├── index.ts               # Main entry: spawns child process with OAuth token
├── auth/
│   ├── config.ts          # Config loading (mcp-config.json + env vars)
│   ├── oauth-handler.ts   # OAuth 2.0 browser flow (native http)
│   └── token-manager.ts   # Token storage & refresh
├── cli/
│   └── login.ts           # OAuth login + Glean CLI token seeding
├── proxy/
│   └── fetch-interceptor.ts  # Fetch interceptor for token injection
├── types/
│   └── index.ts           # TypeScript type definitions
└── utils/
    └── logger.ts          # File logger
```

## How It Works

1. Wrapper checks for valid tokens
2. If missing/expired, triggers OAuth flow
3. Opens browser → user authenticates
4. Saves tokens to `~/.glean/tokens.json`
5. Spawns `@gleanwork/local-mcp-server` with fetch interceptor
6. Monitors token expiration every 5 minutes
7. Auto-refreshes tokens (no server restart needed — interceptor reads from disk)

## Configuration

Create `~/.glean/mcp-config.json`:

```json
{
  "clientId": "your_client_id",
  "clientSecret": "your_client_secret",
  "issuerUrl": "https://your-company.okta.com",
  "apiBaseUrl": "https://your-company-be.glean.com"
}
```

Or set environment variables:

```bash
export GLEAN_CLIENT_ID=your_id
export GLEAN_CLIENT_SECRET=your_secret
export OAUTH_ISSUER_URL=https://your-company.okta.com
export GLEAN_SERVER_URL=https://your-company-be.glean.com
```

## Publishing

Releases are handled via the GitHub Actions **Release** workflow (`workflow_dispatch`).
See [RELEASE.md](../../.github/RELEASE.md) for details.
