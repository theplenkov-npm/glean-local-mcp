/**
 * OAuth configuration for authentication
 */
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  issuerUrl: string;  // OAuth issuer URL (e.g., https://your-domain.okta.com)
  redirectUri: string;
  oauthPort: number;
  scopes: string;
}

/**
 * OIDC discovery configuration
 */
export interface OIDCConfiguration {
  authorization_endpoint: string;
  token_endpoint: string;
  issuer: string;
}

/**
 * Glean API configuration
 */
export interface GleanConfig {
  apiBaseUrl: string;
  tokenStoragePath: string;
}

/**
 * OAuth token data
 */
export interface TokenData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  issued_at: number;
}

