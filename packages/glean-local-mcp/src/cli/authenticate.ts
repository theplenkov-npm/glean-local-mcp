#!/usr/bin/env node

import { Config } from '../auth/config.js';
import { TokenManager } from '../auth/token-manager.js';
import { OAuthHandler } from '../auth/oauth-handler.js';

async function authenticate() {
  try {
    console.log('🔐 Glean OAuth Authentication\n');

    // Load configuration
    const config = Config.getInstance();

    // Initialize token manager
    const tokenManager = new TokenManager(config.glean.tokenStoragePath);

    // Check if already authenticated
    if (tokenManager.hasValidTokens()) {
      console.log('✅ You are already authenticated!');
      console.log('   Access token is valid.\n');
      
      const shouldReauth = process.argv.includes('--force');
      
      if (!shouldReauth) {
        console.log('   Use --force to re-authenticate.\n');
        return;
      }
      
      console.log('   Forcing re-authentication...\n');
      tokenManager.clearTokens();
    }

    // Initialize OAuth handler
    const oauthHandler = new OAuthHandler(config.oauth, tokenManager);

    console.log('Starting OAuth flow...');
    console.log('A browser window will open for you to authenticate.\n');

    // Perform authentication
    const tokenData = await oauthHandler.authenticate();

    console.log('\n✅ Authentication successful!');
    console.log(`   Access token obtained and saved to: ${config.glean.tokenStoragePath}`);
    console.log(`   Token expires in: ${Math.floor(tokenData.expires_in / 60)} minutes\n`);
    console.log('You can now use the Glean MCP Server in Cursor.\n');

  } catch (error) {
    console.error('\n❌ Authentication failed:', error);
    process.exit(1);
  }
}

authenticate();

