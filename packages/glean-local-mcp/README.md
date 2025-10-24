# glean-local-mcp

OAuth wrapper for `@gleanwork/local-mcp-server` - enables Cursor and other MCP clients to use Glean with OAuth 2.0 authentication.

## Installation

```bash
npm install -g glean-local-mcp
```

Or use with npx (no installation):
```bash
npx glean-local-mcp
```

## Configuration

The wrapper loads configuration in this order (later sources override earlier):
1. `~/.glean/config.json` (persistent, user-specific)
2. Environment variables (temporary, session-specific)

### Option 1: User Config File (Recommended)

Create `~/.glean/config.json`:
```json
{
  "clientId": "your_client_id",
  "clientSecret": "your_client_secret",
  "issuerUrl": "https://your-company.okta.com",
  "apiBaseUrl": "https://your-company.glean.com"
}
```

Then just run:
```bash
npx glean-local-mcp
```

### Option 2: Environment Variables

Set via shell, .env file (with `node --env-file`), or IDE configuration.

## Usage

### With Cursor

**If using `~/.glean/config.json`** (recommended):

```json
{
  "mcpServers": {
    "glean": {
      "command": "npx",
      "args": ["-y", "glean-mcp-oauth"]
    }
  }
}
```

**Or with environment variables**:

```json
{
  "mcpServers": {
    "glean": {
      "command": "npx",
      "args": ["-y", "glean-mcp-oauth"],
      "env": {
        "GLEAN_CLIENT_ID": "your_client_id",
        "GLEAN_CLIENT_SECRET": "your_client_secret",
        "OAUTH_ISSUER_URL": "https://your-company.okta.com",
        "GLEAN_API_BASE_URL": "https://your-company.glean.com"
      }
    }
  }
}
```

Restart Cursor. On first use, your browser opens for OAuth login.

### With Other MCP Clients

Use the same configuration pattern with your MCP client's config file.

## Configuration Reference

Configuration can be set in `~/.glean/config.json` or via environment variables.

| Field / Variable | Required | Description |
|------------------|----------|-------------|
| `clientId` / `GLEAN_CLIENT_ID` | Yes | OAuth Client ID |
| `clientSecret` / `GLEAN_CLIENT_SECRET` | Yes | OAuth Client Secret |
| `issuerUrl` / `OAUTH_ISSUER_URL` | Yes | OAuth provider URL (supports OIDC discovery) |
| `apiBaseUrl` / `GLEAN_API_BASE_URL` | Yes | Glean API URL |
| `redirectUri` / `REDIRECT_URI` | No | OAuth callback (default: `http://localhost:8080/...`) |
| `oauthPort` / `OAUTH_PORT` | No | Callback port (default: `8080`) |
| `scopes` / `OAUTH_SCOPES` | No | Comma-separated scopes (default: `openid,email,profile,offline_access`) |

## How It Works

```
Your IDE → OAuth Wrapper → @gleanwork/local-mcp-server → Glean API
            ↓
        • Authenticates via OAuth
        • Stores tokens locally
        • Refreshes automatically
        • Passes to local-mcp-server
```

## Features

- ✅ OAuth 2.0 authentication via browser
- ✅ Automatic token refresh (every 5 minutes)
- ✅ Token persistence between sessions
- ✅ Zero HTTP dependencies (native fetch/http)
- ✅ Works with official Glean MCP tools

## Token Storage

Tokens are securely stored in `~/.glean/tokens.json` by default. Override with `TOKEN_STORAGE_PATH` if needed.

## Troubleshooting

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

## License

MIT

