# glean-local-mcp

> [!IMPORTANT]
> This package is deprecated / no longer maintained.
>
> Do not use `@theplenkov-npm/glean-local-mcp` for new MCP setups. It wraps `@gleanwork/local-mcp-server` which predates Glean's managed remote MCP server and is no longer the supported path for connecting MCP-compatible hosts to Glean.

## What to use instead

Use the managed Glean MCP server built into your Glean instance:

- [Using the Glean MCP Server](https://docs.glean.com/user-guide/mcp/usage) — end-user setup for supported MCP hosts.
- [Set up Glean MCP server](https://docs.glean.com/administration/platform/mcp/enable-mcp-servers) — admin setup and enablement.
- [About Glean MCP server](https://docs.glean.com/administration/platform/mcp/about) — overview of Glean's managed MCP server.

For local command-line workflows, use [Glean CLI](https://github.com/gleanwork/glean-cli) instead.

## Package status

`@theplenkov-npm/glean-local-mcp` is no longer maintained. No new feature work or bug fixes are planned for this package.

Do not treat this package as an actively maintained MCP surface. Existing users should migrate to the managed Glean MCP server where possible.

---

[![npm version](https://badge.fury.io/js/glean-local-mcp.svg)](https://www.npmjs.com/package/glean-local-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

OAuth wrapper for `@gleanwork/local-mcp-server` - enabled Cursor and other MCP clients to use Glean with OAuth 2.0 authentication.

**Repository**: [https://github.com/theplenkov-npm/glean-local-mcp](https://github.com/theplenkov-npm/glean-local-mcp)

## Installation (Historical)

```bash
bun install -g glean-local-mcp
```

Or use with bunx (no installation):
```bash
bunx glean-local-mcp
```

## Configuration (Historical)

The wrapper loaded configuration in this order (later sources override earlier):
1. `~/.glean/mcp-config.json` (persistent, user-specific)
2. Environment variables (temporary, session-specific)

### Option 1: User Config File (Recommended)

Create `~/.glean/mcp-config.json`:
```json
{
  "clientId": "your_client_id",
  "clientSecret": "your_client_secret",
  "issuerUrl": "https://your-company.okta.com",
  "apiBaseUrl": "https://your-company-be.glean.com"
}
```

Then just run:
```bash
bunx glean-local-mcp
```

### Option 2: Environment Variables

Set via shell, .env file (with `node --env-file`), or IDE configuration.

## Usage (Historical)

### With Cursor

**If using `~/.glean/mcp-config.json`** (recommended):

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

**Or with environment variables**:

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

Restart Cursor. On first use, your browser opens for OAuth login.

### With Other MCP Clients

Use the same configuration pattern with your MCP client's config file.

## Configuration Reference (Historical)

Configuration could be set in `~/.glean/mcp-config.json` or via environment variables.

| Field / Variable | Required | Description |
|------------------|----------|-------------|
| `clientId` / `GLEAN_CLIENT_ID` | Yes | OAuth Client ID |
| `clientSecret` / `GLEAN_CLIENT_SECRET` | Yes | OAuth Client Secret |
| `issuerUrl` / `OAUTH_ISSUER_URL` | Yes | OAuth provider URL (supports OIDC discovery) |
| `apiBaseUrl` / `GLEAN_SERVER_URL` | Yes | Glean API base URL (e.g., `https://company-be.glean.com`) |
| `redirectUri` / `REDIRECT_URI` | No | OAuth callback (default: `http://localhost:8080/...`) |
| `oauthPort` / `OAUTH_PORT` | No | Callback port (default: `8080`) |
| `scopes` / `OAUTH_SCOPES` | No | Comma-separated scopes (default: `openid,email,profile,offline_access`) |

## How It Worked (Historical)

```
Your IDE → OAuth Wrapper → @gleanwork/local-mcp-server → Glean API
            ↓
        • Authenticated via OAuth
        • Stored tokens locally
        • Refreshed automatically
        • Passed to local-mcp-server
```

## Features (Historical)

- ✅ OAuth 2.0 authentication via browser
- ✅ Automatic token refresh (every 5 minutes)
- ✅ Token persistence between sessions
- ✅ Zero HTTP dependencies (native fetch/http)
- ✅ Worked with official Glean MCP tools

## Token Storage (Historical)

Tokens were securely stored in `~/.glean/tokens.json` by default. Could be overridden with `TOKEN_STORAGE_PATH`.

## Troubleshooting (Historical)

**"Missing OAuth configuration"**
- Verify all required environment variables are set

**"Port already in use"**
- Change `OAUTH_PORT` to a different port
- Update `REDIRECT_URI` to match

**Authentication fails**
- Clear tokens: `rm ~/.glean/tokens.json`
- Try again

## Requirements

- Node.js 24.0.0+
- OAuth credentials for your Glean instance

## Contributing

Contributions are welcome! Please visit the [repository](https://github.com/theplenkov-npm/glean-local-mcp) to:
- [Report issues](https://github.com/theplenkov-npm/glean-local-mcp/issues)
- [Submit pull requests](https://github.com/theplenkov-npm/glean-local-mcp/pulls)
- [Request features](https://github.com/theplenkov-npm/glean-local-mcp/issues)

## License

MIT - See [LICENSE](https://github.com/theplenkov-npm/glean-local-mcp/blob/main/LICENSE) for details.
