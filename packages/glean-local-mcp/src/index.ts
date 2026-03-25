#!/usr/bin/env node

import { spawn, ChildProcess } from 'child_process';
import { Config } from './auth/config.js';
import { TokenManager } from './auth/token-manager.js';
import { OAuthHandler } from './auth/oauth-handler.js';
import { getLogger, closeLogger } from './utils/logger.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

/**
 * Detects which package manager invoked the wrapper
 * @returns The package manager command ('npx', 'bunx', or 'pnpm dlx')
 */
function detectPackageManager(): string {
  // Check npm_execpath (set by npm/npx, bun, and pnpm)
  const npmExecPath = process.env['npm_execpath'];
  if (npmExecPath) {
    if (npmExecPath.includes('bun')) {
      return 'bunx';
    }
    if (npmExecPath.includes('pnpm')) {
      return 'pnpm dlx';
    }
    // Default to npx for npm/yarn
    return 'npx';
  }

  // Check process name as fallback (for cases where npm_execpath is not set)
  // This is less reliable but helps in edge cases
  const parentProcessName = process.argv[1];
  if (parentProcessName?.includes('bun')) {
    return 'bunx';
  }
  if (parentProcessName?.includes('pnpm')) {
    return 'pnpm dlx';
  }

  // Default to npx
  return 'npx';
}

/**
 * Parses package manager command into executable and args
 * @param packageManager The package manager string (e.g., 'npx', 'bunx', 'pnpm dlx')
 * @returns Object with 'command' (executable) and 'args' (initial arguments)
 */
function parsePackageManager(packageManager: string): { command: string; args: string[] } {
  const parts = packageManager.split(' ');
  const command = parts[0];
  const args = parts.slice(1);
  return { command, args };
}

/**
 * OAuth wrapper that manages tokens and spawns @gleanwork/local-mcp-server
 * with a valid token, automatically refreshing when needed.
 */
class GleanOAuthWrapper {
  private config: Config;
  private tokenManager: TokenManager;
  private oauthHandler: OAuthHandler;
  private serverProcess: ChildProcess | null = null;
  private tokenRefreshInterval: NodeJS.Timeout | null = null;
  private logger = getLogger();

  constructor() {
    this.config = Config.getInstance();
    this.tokenManager = new TokenManager(this.config.glean.tokenStoragePath);
    this.oauthHandler = new OAuthHandler(this.config.oauth, this.tokenManager);

    this.logger.info(`Glean OAuth Wrapper initialized (headless=${this.config.glean.headless})`);
    this.logger.info(`Log file: ${this.logger.getLogPath()}`);
  }

  async ensureAuthenticated(): Promise<string> {
    // Check if we have valid tokens
    if (!this.tokenManager.hasValidTokens()) {
      // Try to refresh first if we have a refresh token
      const refreshToken = this.tokenManager.getRefreshToken();

      if (refreshToken) {
        this.logger.info('Tokens expired, attempting refresh...');
        try {
          const newTokenData = await this.oauthHandler.refreshAccessToken(refreshToken);
          await this.tokenManager.saveTokens(newTokenData);
          this.logger.info('Token refreshed successfully!');
        } catch (error) {
          if (this.config.glean.headless) {
            this.logger.warn('Token refresh failed in headless mode, starting headless auth...');
            return this.headlessAuthenticate();
          }
          this.logger.warn('Token refresh failed, starting full authentication...', error);
          await this.oauthHandler.authenticate();
          this.logger.info('Authentication successful!');
        }
      } else if (this.config.glean.headless) {
        // No refresh token at all in headless mode
        this.logger.info('No tokens found in headless mode, starting headless auth...');
        return this.headlessAuthenticate();
      } else {
        // No refresh token, do full OAuth
        this.logger.info('No valid tokens found. Starting authentication...');
        console.error('A browser window will open for you to authenticate.\n');
        await this.oauthHandler.authenticate();
        this.logger.info('Authentication successful!');
      }
    }

    const token = this.tokenManager.getAccessToken();
    if (!token) {
      const error = new Error('Failed to get access token after authentication');
      this.logger.error('Failed to get access token', error);
      throw error;
    }

    return token;
  }

  /**
   * Headless authentication: race two strategies and use whichever succeeds first.
   * 
   * 1. OAuth callback server — starts a local HTTP server and logs the auth URL
   *    to stderr so the MCP client, agent, or operator can open it in a browser.
   *    If the callback is reachable (same machine, port-forwarded, etc.), auth
   *    completes normally.
   * 
   * 2. Token file watcher — watches ~/.glean/tokens.json for an externally-
   *    provided refresh token and exchanges it for an access token.
   */
  private async headlessAuthenticate(): Promise<string> {
    const tokenPath = this.config.glean.tokenStoragePath;
    this.logger.info('[HEADLESS] Racing OAuth callback server vs token file watcher...');
    console.error(
      `[HEADLESS] Two ways to authenticate:\n` +
      `  1. Open the URL that will be printed below in a browser\n` +
      `  2. Write { "refresh_token": "..." } to ${tokenPath}\n`
    );

    // Strategy 1: OAuth callback (URL printed to stderr, no browser auto-open)
    const oauthPromise = this.oauthHandler.authenticate({ headless: true })
      .then((tokenData) => {
        this.logger.info('[HEADLESS] OAuth callback succeeded');
        return tokenData.access_token;
      });

    // Strategy 2: Token file watcher
    const filePromise = this.waitForTokenFileUpdate();

    // First one wins
    const token = await Promise.race([oauthPromise, filePromise]);

    // Clean up the loser
    this.oauthHandler.cancelAuthentication();
    this.tokenManager.stopWatching();

    return token;
  }

  /**
   * In headless mode, block until a valid token file appears on disk.
   * Logs instructions for the operator every 30 seconds.
   */
  private waitForTokenFileUpdate(): Promise<string> {
    const tokenPath = this.config.glean.tokenStoragePath;
    this.logger.info(`[HEADLESS] Watching ${tokenPath} for a fresh refresh token...`);
    console.error(
      `\n[HEADLESS] No valid tokens. ` +
      `Write a JSON file with at least { "refresh_token": "..." } to:\n  ${tokenPath}\n`
    );

    return new Promise<string>((resolve, reject) => {
      let reminderInterval: NodeJS.Timeout | null = null;

      const onTokenChange = async () => {
        const refreshToken = this.tokenManager.getRefreshToken();
        if (!refreshToken) return;

        this.logger.info('[HEADLESS] New refresh token detected, exchanging for access token...');
        try {
          const newTokenData = await this.oauthHandler.refreshAccessToken(refreshToken);
          this.tokenManager.saveTokens(newTokenData);
          this.logger.info('[HEADLESS] Token exchange successful!');

          if (reminderInterval) clearInterval(reminderInterval);
          this.tokenManager.stopWatching();

          const accessToken = this.tokenManager.getAccessToken();
          if (accessToken) {
            resolve(accessToken);
          } else {
            reject(new Error('Access token invalid immediately after refresh'));
          }
        } catch (err) {
          this.logger.error('[HEADLESS] Token exchange failed – the refresh token may be invalid. Continuing to watch...', err);
          console.error('[HEADLESS] Refresh token exchange failed. Please provide a valid refresh token.');
        }
      };

      this.tokenManager.watchTokenFile(onTokenChange);

      // Also try immediately in case the file was already updated before we started watching
      this.tokenManager.reloadTokens();
      if (this.tokenManager.getRefreshToken()) {
        onTokenChange();
      }

      reminderInterval = setInterval(() => {
        console.error(`[HEADLESS] Still waiting for a valid refresh token at: ${tokenPath}`);
      }, 30_000);
    });
  }

  async startServer(): Promise<void> {
    // Ensure we have a valid token
    const token = await this.ensureAuthenticated();

    // Get path to fetch interceptor (built version)
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const fetchInterceptorPath = join(__dirname, 'proxy', 'fetch-interceptor.mjs');

    const apiBaseUrl = this.config.glean.apiBaseUrl;

    this.logger.info(`Starting @gleanwork/local-mcp-server...`);
    this.logger.info(`   API Base URL: ${apiBaseUrl}`);
    this.logger.info(`   Fetch Interceptor: ${fetchInterceptorPath}`);
    this.logger.debug(`   Token: ${token.substring(0, 20)}...`);

    // Detect which package manager invoked this wrapper
    const packageManager = detectPackageManager();
    const { command: pmCommand, args: pmArgs } = parsePackageManager(packageManager);
    this.logger.info(`   Package Manager: ${packageManager}`);

    // Spawn the actual Glean local MCP server
    // SECURITY: Token is injected via interceptor, NOT via command-line args
    // (command-line args are visible in process lists via 'ps')
    this.serverProcess = spawn(pmCommand, [
      ...pmArgs,
      '-y',
      '@gleanwork/local-mcp-server',
      '--server-url', apiBaseUrl,
      '--trace'  // Enable trace logging for debugging
    ], {
      stdio: ['pipe', 'pipe', 'pipe'], // Capture all streams for logging
      env: {
        ...process.env,
        GLEAN_SERVER_URL: apiBaseUrl,
        NODE_DEBUG: 'http,https',  // Enable Node.js networking debug
        NODE_OPTIONS: `--import ${fetchInterceptorPath}` // Inject fetch interceptor via --import
        // SECURITY: Token is NOT passed via env vars - interceptor reads from ~/.glean/tokens.json
      }
    });

    // Pipe stdin from parent to child (for MCP protocol)
    if (this.serverProcess.stdin && process.stdin) {
      process.stdin.pipe(this.serverProcess.stdin);
    }

    // Capture and log stdout (also pipe to parent for MCP responses)
    if (this.serverProcess.stdout) {
      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        this.logger.debug('[MCP Server stdout] ' + output.trim());
        process.stdout.write(data); // Pass through for MCP protocol
      });
    }

    // Capture and log stderr (also show on console)
    if (this.serverProcess.stderr) {
      this.serverProcess.stderr.on('data', (data) => {
        const output = data.toString();
        this.logger.info('[MCP Server stderr] ' + output.trim());
        process.stderr.write(data); // Pass through for visibility
      });
    }

    this.serverProcess.on('error', (error) => {
      this.logger.error('Failed to start @gleanwork/local-mcp-server', error);
      process.exit(1);
    });

    this.serverProcess.on('exit', (code) => {
      this.logger.info(`@gleanwork/local-mcp-server exited with code ${code}`);
      this.cleanup();
      process.exit(code || 0);
    });

    // Set up automatic token refresh (no server restart needed –
    // the fetch interceptor reads fresh tokens from disk on each request)
    this.setupTokenRefresh();

    // In headless mode, also watch for externally-provided token updates
    if (this.config.glean.headless) {
      this.setupHeadlessTokenWatch();
    }

    // Handle graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  private setupTokenRefresh(): void {
    // Check token validity every 5 minutes
    const checkInterval = 5 * 60 * 1000;

    this.tokenRefreshInterval = setInterval(async () => {
      if (!this.tokenManager.hasValidTokens()) {
        this.logger.info('Token expired, refreshing...');

        const refreshToken = this.tokenManager.getRefreshToken();
        if (refreshToken) {
          try {
            const newTokenData = await this.oauthHandler.refreshAccessToken(refreshToken);
            this.tokenManager.saveTokens(newTokenData);
            this.logger.info('Token refreshed successfully');
            // No server restart needed – fetch interceptor reads fresh tokens from disk
          } catch (error) {
            this.logger.error('Token refresh failed', error);
            if (this.config.glean.headless) {
              console.error(
                `[HEADLESS] Token refresh failed. ` +
                `Update the refresh token at: ${this.config.glean.tokenStoragePath}`
              );
            } else {
              this.logger.error('Please re-authenticate manually');
            }
          }
        }
      }
    }, checkInterval);
  }

  /**
   * In headless mode, watch for external token file updates and
   * automatically exchange the new refresh token for a fresh access token.
   */
  private setupHeadlessTokenWatch(): void {
    this.tokenManager.watchTokenFile(async (tokenData) => {
      this.logger.info('[HEADLESS] Token file changed externally, attempting refresh...');
      const refreshToken = tokenData.refresh_token;
      if (!refreshToken) return;

      try {
        const newTokenData = await this.oauthHandler.refreshAccessToken(refreshToken);
        this.tokenManager.saveTokens(newTokenData);
        this.logger.info('[HEADLESS] Token refreshed from externally-provided refresh token');
      } catch (err) {
        this.logger.error('[HEADLESS] Failed to exchange externally-provided refresh token', err);
      }
    });
  }

  private cleanup(): void {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
    }
    this.tokenManager.stopWatching();
  }

  private shutdown(): void {
    console.error('\nShutting down Glean OAuth Wrapper...');

    this.cleanup();

    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
    }

    process.exit(0);
  }
}

// Main entry point
async function main() {
  // Handle `glean-local-mcp login` subcommand
  const subcommand = process.argv[2];
  if (subcommand === 'login') {
    // Dynamically import the login CLI to keep the main bundle small
    await import('./cli/login.js');
    return;
  }

  const logger = getLogger();
  try {
    logger.info('=== Glean OAuth Wrapper Starting ===');
    const wrapper = new GleanOAuthWrapper();
    await wrapper.startServer();
  } catch (error) {
    logger.error('Failed to start Glean OAuth Wrapper', error);
    closeLogger();
    process.exit(1);
  }
}

main();

