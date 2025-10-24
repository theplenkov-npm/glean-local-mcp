import { createServer, Server as HttpServer, IncomingMessage, ServerResponse } from 'http';
import open from 'open';
import { OAuthConfig, TokenData, OIDCConfiguration } from '../types/index.js';
import { TokenManager } from './token-manager.js';

export class OAuthHandler {
  private config: OAuthConfig;
  private tokenManager: TokenManager;
  private server: HttpServer | null = null;
  private oidcConfig: OIDCConfiguration | null = null;

  constructor(config: OAuthConfig, tokenManager: TokenManager) {
    this.config = config;
    this.tokenManager = tokenManager;
  }

  private async discoverOIDCEndpoints(): Promise<OIDCConfiguration> {
    if (this.oidcConfig) {
      return this.oidcConfig;
    }

    const discoveryUrl = `${this.config.issuerUrl}/.well-known/openid-configuration`;
    
    try {
      console.error(`🔍 Discovering OIDC endpoints at: ${discoveryUrl}`);
      const response = await fetch(discoveryUrl);
      if (!response.ok) {
        throw new Error(`Discovery failed: ${response.status} ${response.statusText}`);
      }
      this.oidcConfig = await response.json() as OIDCConfiguration;
      console.error(`✓ OIDC discovery successful`);
      return this.oidcConfig;
    } catch (error) {
      // Fallback to standard OAuth2 paths if discovery fails
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`⚠️  OIDC discovery failed: ${errorMessage}`);
      console.error(`   Using standard OAuth2 paths as fallback`);
      this.oidcConfig = {
        authorization_endpoint: `${this.config.issuerUrl}/oauth2/v1/authorize`,
        token_endpoint: `${this.config.issuerUrl}/oauth2/v1/token`,
        issuer: this.config.issuerUrl
      };
      return this.oidcConfig;
    }
  }

  private async getAuthorizationUrl(): Promise<string> {
    const oidc = await this.discoverOIDCEndpoints();
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      scope: this.config.scopes,
      redirect_uri: this.config.redirectUri,
      state: this.generateRandomState()
    });

    return `${oidc.authorization_endpoint}?${params.toString()}`;
  }

  private generateRandomState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  public async authenticate(): Promise<TokenData> {
    return new Promise((resolve, reject) => {
      let authCode: string | null = null;

      const requestHandler = async (req: IncomingMessage, res: ServerResponse) => {
        if (!req.url) return;

        const url = new URL(req.url, `http://localhost:${this.config.oauthPort}`);
        
        if (url.pathname === '/authorization-code/callback') {
          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');

          if (error) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body>
                  <h1>Authentication Failed</h1>
                  <p>Error: ${error}</p>
                  <p>You can close this window.</p>
                </body>
              </html>
            `);
            reject(new Error(`OAuth error: ${error}`));
            return;
          }

          if (code) {
            authCode = code;
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body>
                  <h1>Authentication Successful!</h1>
                  <p>You can now close this window and return to your terminal.</p>
                  <script>setTimeout(() => window.close(), 3000);</script>
                </body>
              </html>
            `);

            // Exchange code for tokens
            try {
              const tokenData = await this.exchangeCodeForToken(authCode);
              this.tokenManager.saveTokens(tokenData);
              
              // Close server after successful authentication
              setTimeout(() => {
                this.server?.close();
                resolve(tokenData);
              }, 1000);
            } catch (error) {
              this.server?.close();
              reject(error);
            }
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body>
                  <h1>Authentication Failed</h1>
                  <p>No authorization code received.</p>
                  <p>You can close this window.</p>
                </body>
              </html>
            `);
            reject(new Error('No authorization code received'));
          }
        }
      };

      this.server = createServer(requestHandler);
      
      this.server.listen(this.config.oauthPort, async () => {
        const authUrl = await this.getAuthorizationUrl();
        console.log('\n🔐 Opening browser for authentication...\n');
        console.log(`If the browser doesn't open automatically, visit:\n${authUrl}\n`);
        
        // Open browser
        open(authUrl).catch((err) => {
          console.error('Could not open browser automatically. Please visit the URL above manually.');
        });
      });

      // Set timeout for authentication
      setTimeout(() => {
        if (authCode === null) {
          this.server?.close();
          reject(new Error('Authentication timeout'));
        }
      }, 300000); // 5 minutes timeout
    });
  }

  private async exchangeCodeForToken(code: string): Promise<TokenData> {
    const oidc = await this.discoverOIDCEndpoints();
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret
    });

    try {
      console.error(`🔐 Exchanging authorization code for token at: ${oidc.token_endpoint}`);
      const response = await fetch(oidc.token_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (!response.ok) {
        const errorData = await response.json() as any;
        const errorMsg = errorData?.error_description || response.statusText;
        console.error(`❌ Token exchange failed: ${response.status} ${errorMsg}`);
        throw new Error(`Token exchange failed: ${errorMsg}`);
      }

      console.error(`✓ Token exchange successful`);
      return await response.json() as TokenData;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`❌ Token exchange error: ${error.message}`);
        if (error.message.includes('fetch failed')) {
          console.error(`   This might be a network/proxy issue. Check:`);
          console.error(`   - Can you reach ${oidc.token_endpoint}?`);
          console.error(`   - Are you behind a corporate proxy?`);
          console.error(`   - Do you need to set HTTP_PROXY/HTTPS_PROXY?`);
        }
        throw new Error(`Token exchange failed: ${error.message}`);
      }
      throw error;
    }
  }

  public async refreshAccessToken(refreshToken: string): Promise<TokenData> {
    const oidc = await this.discoverOIDCEndpoints();
    
    const authHeader = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
    
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });

    try {
      console.error(`🔄 Refreshing token at: ${oidc.token_endpoint}`);
      const response = await fetch(oidc.token_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authHeader}`
        },
        body: params.toString()
      });

      if (!response.ok) {
        const errorData = await response.json() as any;
        const errorMsg = errorData?.error_description || response.statusText;
        console.error(`❌ Token refresh failed: ${response.status} ${errorMsg}`);
        throw new Error(`Token refresh failed: ${errorMsg}`);
      }

      console.error(`✓ Token refreshed successfully`);
      return await response.json() as TokenData;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`❌ Token refresh error: ${error.message}`);
        if (error.message.includes('fetch failed')) {
          console.error(`   This might be a network/proxy issue. Check:`);
          console.error(`   - Can you reach ${oidc.token_endpoint}?`);
          console.error(`   - Are you behind a corporate proxy?`);
          console.error(`   - Do you need to set HTTP_PROXY/HTTPS_PROXY?`);
        }
        throw new Error(`Token refresh failed: ${error.message}`);
      }
      throw error;
    }
  }
}
