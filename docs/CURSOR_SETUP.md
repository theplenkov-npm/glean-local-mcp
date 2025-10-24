# Cursor IDE Setup

## Step 1: Store Your Credentials

**Option A: User config file (Recommended)**

Create `~/.glean/config.json`:
```json
{
  "clientId": "your_client_id",
  "clientSecret": "your_client_secret",
  "issuerUrl": "https://your-company.okta.com",
  "apiBaseUrl": "https://your-company.glean.com"
}
```

**Option B: Environment variables**

Keep them in your shell or `.env` file (loaded via `node --env-file`).

## Step 2: Configure Cursor

Edit `~/.cursor/mcp.json`:

**If using `~/.glean/config.json`**:
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

## Restart Cursor

Close and reopen Cursor completely.

## First Use

On first tool invocation, a browser window opens for OAuth login. Authenticate and return to Cursor - tokens are saved for future use.

## Example Prompts

- "Search Glean for kubernetes documentation"
- "Ask Glean about company holidays"
- "What are recent engineering announcements?"

Cursor will automatically use the Glean tools when appropriate.

## Troubleshooting

Check Cursor's developer console: **Help → Toggle Developer Tools**

Look for stderr output from the MCP server for debugging.

