#!/usr/bin/env node

import { spawn, ChildProcess } from 'child_process';
import { Config } from './auth/config.js';
import { TokenManager } from './auth/token-manager.js';
import { OAuthHandler } from './auth/oauth-handler.js';
import { getLogger, closeLogger } from './utils/logger.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
    
    this.logger.info(`Glean OAuth Wrapper initialized`);
    this.logger.info(`Log file: ${this.logger.getLogPath()}`);
  }

  async ensureAuthenticated(): Promise<string> {
    // Check if we have valid tokens
    if (!this.tokenManager.hasValidTokens()) {
      // Try to refresh first if we have a refresh token
      const refreshToken = this.tokenManager.getRefreshToken();
      
      if (refreshToken) {
        this.logger.info('🔄 Tokens expired, attempting refresh...');
        try {
          const newTokenData = await this.oauthHandler.refreshAccessToken(refreshToken);
          await this.tokenManager.saveTokens(newTokenData);
          this.logger.info('✅ Token refreshed successfully!');
        } catch (error) {
          this.logger.warn('⚠️  Token refresh failed, starting full authentication...', error);
          await this.oauthHandler.authenticate();
          this.logger.info('✅ Authentication successful!');
        }
      } else {
        // No refresh token, do full OAuth
        this.logger.info('🔐 No valid tokens found. Starting authentication...');
        console.error('A browser window will open for you to authenticate.\n');
        await this.oauthHandler.authenticate();
        this.logger.info('✅ Authentication successful!');
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

  async startServer(): Promise<void> {
    // Ensure we have a valid token
    const token = await this.ensureAuthenticated();

    // Get path to fetch interceptor (built version)
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const fetchInterceptorPath = join(__dirname, 'proxy', 'fetch-interceptor.js');

    // Extract instance name from API base URL
    // e.g., https://company-prod-be.glean.com -> company-prod (remove -be suffix)
    const instanceMatch = this.config.glean.apiBaseUrl.match(/https?:\/\/([^.]+)/);
    let instance = instanceMatch ? instanceMatch[1] : 'default';
    
    // Remove -be suffix if present (local-mcp-server adds it automatically)
    if (instance.endsWith('-be')) {
      instance = instance.slice(0, -3);
    }

    this.logger.info(`🚀 Starting @gleanwork/local-mcp-server...`);
    this.logger.info(`   Instance: ${instance}`);
    this.logger.info(`   API Base URL: ${this.config.glean.apiBaseUrl}`);
    this.logger.info(`   Constructed URL will be: https://${instance}-be.glean.com/`);
    this.logger.info(`   Fetch Interceptor: ${fetchInterceptorPath}`);
    this.logger.debug(`   Token: ${token.substring(0, 20)}...`);

    // Spawn the actual Glean local MCP server
    // SECURITY: Token is injected via interceptor, NOT via command-line args
    // (command-line args are visible in process lists via 'ps')
    this.serverProcess = spawn('npx', [
      '-y',
      '@gleanwork/local-mcp-server',
      '--instance', instance,
      '--trace'  // Enable trace logging for debugging
    ], {
      stdio: ['pipe', 'pipe', 'pipe'], // Capture all streams for logging
      env: {
        ...process.env,
        GLEAN_URL: this.config.glean.apiBaseUrl, // Use exact URL to avoid -be suffix issues
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

    // Set up automatic token refresh
    this.setupTokenRefresh();

    // Handle graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  private setupTokenRefresh(): void {
    // Check token validity every 5 minutes
    const checkInterval = 5 * 60 * 1000;

    this.tokenRefreshInterval = setInterval(async () => {
      if (!this.tokenManager.hasValidTokens()) {
        this.logger.info('♻️  Token expired, refreshing...');
        
        const refreshToken = this.tokenManager.getRefreshToken();
        if (refreshToken) {
          try {
            const newTokenData = await this.oauthHandler.refreshAccessToken(refreshToken);
            this.tokenManager.saveTokens(newTokenData);
            this.logger.info('✅ Token refreshed successfully');
            
            // Restart the server with new token
            this.logger.info('🔄 Restarting server with new token...');
            this.restartServer();
          } catch (error) {
            this.logger.error('❌ Token refresh failed', error);
            this.logger.error('Please re-authenticate manually');
          }
        }
      }
    }, checkInterval);
  }

  private async restartServer(): Promise<void> {
    // Kill the current server
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
      this.serverProcess = null;
    }

    // Wait a bit before restarting
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Start with new token
    await this.startServer();
  }

  private cleanup(): void {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
    }
  }

  private shutdown(): void {
    console.error('\n👋 Shutting down Glean OAuth Wrapper...');
    
    this.cleanup();
    
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
    }
    
    process.exit(0);
  }
}

// Main entry point
async function main() {
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

