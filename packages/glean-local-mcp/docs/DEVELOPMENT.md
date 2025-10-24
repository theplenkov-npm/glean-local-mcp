# Development Guide

## Setup

```bash
cd packages/glean-local-mcp-server
npm install
```

## Build

```bash
npm run build
```

Uses `tsdown` for fast bundling (~55ms).

## Development

```bash
npm run dev
```

Builds and runs the wrapper locally.

## Authentication Testing

```bash
npm run auth
```

Opens browser for OAuth flow and saves tokens to `.tokens.json`.

## Project Structure

```
src/
├── wrapper.ts              # Main OAuth wrapper
├── auth/
│   ├── config.ts          # Environment config
│   ├── oauth-handler.ts   # OAuth flow (native http)
│   └── token-manager.ts   # Token storage/refresh
├── cli/
│   └── authenticate.ts    # Standalone auth tool
└── types/
    └── index.ts           # TypeScript definitions
```

## How It Works

1. Wrapper checks for valid tokens
2. If missing/expired, triggers OAuth flow
3. Opens browser → user authenticates
4. Saves tokens locally
5. Spawns `@gleanwork/local-mcp-server` with token
6. Monitors token expiration every 5 minutes
7. Auto-refreshes and restarts server with new token

## Configuration

Set environment variables (via nx, node --env-file, or shell):

```bash
export GLEAN_CLIENT_ID=your_id
export GLEAN_CLIENT_SECRET=your_secret
export OAUTH_ISSUER_URL=https://your-company.okta.com
export GLEAN_API_BASE_URL=https://your-company.glean.com
```

Or use Node's `--env-file`:
```bash
cp .env.example .env
# Edit .env
node --env-file=.env dist/wrapper.js
```

## Testing Locally

```bash
# Direct with env vars
GLEAN_CLIENT_ID=xxx GLEAN_CLIENT_SECRET=yyy npm run dev

# With .env file (Node 20.6+)
node --env-file=.env packages/glean-local-mcp-server/dist/wrapper.js
```

## Publishing

```bash
npm run build
npm publish
```

The `prepublishOnly` script ensures build runs before publish.

