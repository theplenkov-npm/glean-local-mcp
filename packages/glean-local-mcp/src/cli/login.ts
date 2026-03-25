#!/usr/bin/env node

/**
 * `glean-local-mcp login` — Perform OAuth login and seed tokens for both
 * glean-local-mcp and the Glean CLI (`glean`).
 *
 * The Glean CLI's own `glean auth login` picks a random localhost port for
 * the redirect URI, which doesn't match the fixed redirect URIs registered
 * in the Okta application. This command works around that by using the
 * fixed redirect URI (http://localhost:8080/oauth/callback) that IS
 * registered, then writing the resulting tokens into the Glean CLI's
 * expected storage location.
 */

import { createHash } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Config } from '../auth/config.js';
import { TokenManager } from '../auth/token-manager.js';
import { OAuthHandler } from '../auth/oauth-handler.js';

/**
 * Compute the directory hash the Glean CLI uses for a given host.
 * It's the first 16 hex characters of the SHA-256 of the hostname.
 */
function gleanCliHostHash(host: string): string {
  return createHash('sha256').update(host).digest('hex').slice(0, 16);
}

/**
 * Seed tokens into ~/.local/state/glean-cli/<hash>/ so the `glean` CLI
 * picks them up without needing its own (broken) login flow.
 */
function seedGleanCliTokens(
  host: string,
  tokenData: { access_token: string; refresh_token: string; expires_in: number; scope: string },
  clientId: string,
  clientSecret: string,
  tokenEndpoint: string,
): void {
  const hash = gleanCliHostHash(host);
  const stateDir = path.join(os.homedir(), '.local', 'state', 'glean-cli', hash);

  fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });

  // tokens.json — format the Glean CLI expects
  const expiry = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
  const cliTokens = {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expiry,
    token_type: 'Bearer',
    token_endpoint: tokenEndpoint,
  };
  fs.writeFileSync(
    path.join(stateDir, 'tokens.json'),
    JSON.stringify(cliTokens, null, 2),
    { encoding: 'utf-8', mode: 0o600 },
  );

  // client.json — needed for the CLI to auto-refresh
  const cliClient = { client_id: clientId, client_secret: clientSecret };
  fs.writeFileSync(
    path.join(stateDir, 'client.json'),
    JSON.stringify(cliClient, null, 2),
    { encoding: 'utf-8', mode: 0o600 },
  );

  console.log(`   Glean CLI tokens:  ${path.join(stateDir, 'tokens.json')}`);
  console.log(`   Glean CLI client:  ${path.join(stateDir, 'client.json')}`);
}

/**
 * Ensure ~/.glean/config.json has the fields the Glean CLI needs.
 */
function ensureGleanCliConfig(host: string, clientId: string, clientSecret: string): void {
  const configPath = path.join(os.homedir(), '.glean', 'config.json');

  let existing: Record<string, unknown> = {};
  if (fs.existsSync(configPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch {
      // overwrite corrupt file
    }
  }

  const updated = {
    ...existing,
    glean_host: host,
    oauth_client_id: clientId,
    oauth_client_secret: clientSecret,
  };

  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(updated, null, 4) + '\n', 'utf-8');
  console.log(`   Glean CLI config:  ${configPath}`);
}

async function login() {
  try {
    const force = process.argv.includes('--force');
    console.log('🔐 Glean OAuth Login\n');

    const config = Config.getInstance();
    const tokenManager = new TokenManager(config.glean.tokenStoragePath);
    const oauthHandler = new OAuthHandler(config.oauth, tokenManager);

    // Strip protocol and trailing slashes for the bare host
    const host = config.glean.apiBaseUrl
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '');

    // If we already have valid tokens, try refresh instead of full flow
    let tokenData;
    const refreshToken = tokenManager.getRefreshToken();

    if (tokenManager.hasValidTokens() && !force) {
      console.log('✅ Already authenticated (tokens are valid).');
      console.log('   Use --force to re-authenticate.\n');

      // Still seed Glean CLI in case it's out of sync
      const existing = tokenManager.getTokenData();
      if (existing) {
        const oidcUrl = `${config.oauth.issuerUrl}/.well-known/openid-configuration`;
        const disc = await fetch(oidcUrl).then(r => r.json()) as { token_endpoint: string };
        console.log('Syncing tokens to Glean CLI...');
        seedGleanCliTokens(host, existing, config.oauth.clientId, config.oauth.clientSecret, disc.token_endpoint);
        ensureGleanCliConfig(host, config.oauth.clientId, config.oauth.clientSecret);
        console.log('\n✅ Glean CLI is ready. Run `glean auth status` to verify.\n');
      }
      return;
    }

    if (refreshToken && !force) {
      console.log('Refreshing existing token...');
      try {
        tokenData = await oauthHandler.refreshAccessToken(refreshToken);
        tokenManager.saveTokens(tokenData);
        console.log('✅ Token refreshed!\n');
      } catch {
        console.log('Refresh failed, starting full OAuth flow...\n');
        tokenData = null;
      }
    }

    if (!tokenData) {
      if (force) {
        tokenManager.clearTokens();
      }
      console.log('Starting OAuth flow...');
      console.log('A browser window will open for you to authenticate.\n');
      tokenData = await oauthHandler.authenticate();
      tokenManager.saveTokens(tokenData);
      console.log('\n✅ OAuth authentication successful!\n');
    }

    // Discover token endpoint for the CLI tokens file
    const oidcUrl = `${config.oauth.issuerUrl}/.well-known/openid-configuration`;
    const discovery = await fetch(oidcUrl).then(r => r.json()) as { token_endpoint: string };

    console.log('Saving tokens...');
    console.log(`   MCP tokens:        ${config.glean.tokenStoragePath}`);
    seedGleanCliTokens(host, tokenData, config.oauth.clientId, config.oauth.clientSecret, discovery.token_endpoint);
    ensureGleanCliConfig(host, config.oauth.clientId, config.oauth.clientSecret);

    console.log(`\n✅ Done! Both glean-local-mcp and Glean CLI are authenticated.`);
    console.log(`   Run \`glean auth status\` to verify.\n`);

  } catch (error) {
    console.error('\n❌ Login failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

login();
