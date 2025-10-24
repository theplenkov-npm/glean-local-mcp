import { OAuthConfig, GleanConfig } from '../types/index.js';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

interface StoredConfig {
  clientId?: string;
  clientSecret?: string;
  issuerUrl?: string;
  apiBaseUrl?: string;
  redirectUri?: string;
  oauthPort?: number;
  scopes?: string;
}

export class Config {
  private static instance: Config;
  public oauth: OAuthConfig;
  public glean: GleanConfig;

  private constructor() {
    // Load from ~/.glean/config.json if it exists
    const gleanDir = path.join(os.homedir(), '.glean');
    const configPath = path.join(gleanDir, 'config.json');
    let storedConfig: StoredConfig = {};
    
    if (fs.existsSync(configPath)) {
      try {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        storedConfig = JSON.parse(configContent);
      } catch (error) {
        console.warn(`Warning: Failed to parse ${configPath}:`, error);
      }
    }

    // Environment variables take precedence over stored config
    const rawScopes = process.env.OAUTH_SCOPES || storedConfig.scopes || 'openid,email,profile,offline_access';
    // Convert comma-separated to space-separated for OAuth
    const scopes = rawScopes.replace(/,/g, ' ');
    
    this.oauth = {
      clientId: process.env.GLEAN_CLIENT_ID || storedConfig.clientId || '',
      clientSecret: process.env.GLEAN_CLIENT_SECRET || storedConfig.clientSecret || '',
      issuerUrl: process.env.OAUTH_ISSUER_URL || storedConfig.issuerUrl || '',
      redirectUri: process.env.REDIRECT_URI || storedConfig.redirectUri || 'http://localhost:8080/authorization-code/callback',
      oauthPort: parseInt(process.env.OAUTH_PORT || String(storedConfig.oauthPort || '8080'), 10),
      scopes: scopes
    };

    // Default token storage in ~/.glean/tokens.json (safe user directory)
    const defaultTokenPath = path.join(gleanDir, 'tokens.json');
    
    this.glean = {
      apiBaseUrl: process.env.GLEAN_API_BASE_URL || storedConfig.apiBaseUrl || '',
      tokenStoragePath: process.env.TOKEN_STORAGE_PATH || defaultTokenPath
    };

    this.validate();
  }

  private validate(): void {
    const missing = [];
    if (!this.oauth.clientId) missing.push('GLEAN_CLIENT_ID');
    if (!this.oauth.clientSecret) missing.push('GLEAN_CLIENT_SECRET');
    if (!this.oauth.issuerUrl) missing.push('OAUTH_ISSUER_URL');
    if (!this.glean.apiBaseUrl) missing.push('GLEAN_API_BASE_URL');
    
    if (missing.length > 0) {
      throw new Error(
        `Missing required configuration: ${missing.join(', ')}. Please set these environment variables.`
      );
    }
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }
}

