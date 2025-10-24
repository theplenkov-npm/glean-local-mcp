# OAuth Provider Configuration

The wrapper supports any OAuth 2.0 provider that implements OpenID Connect (OIDC) discovery.

## How It Works

1. **OIDC Discovery**: Wrapper attempts to fetch `/.well-known/openid-configuration` from your issuer URL
2. **Fallback**: If discovery fails, falls back to standard OAuth 2.0 paths (`/oauth2/v1/authorize`, `/oauth2/v1/token`)

## Supported Providers

### Okta

```env
OAUTH_ISSUER_URL=https://your-company.okta.com
OAUTH_SCOPES=openid,email,profile,offline_access
```

### Auth0

```env
OAUTH_ISSUER_URL=https://your-tenant.auth0.com
OAUTH_SCOPES=openid,email,profile,offline_access
```

### Keycloak

```env
OAUTH_ISSUER_URL=https://auth.your-company.com/realms/your-realm
OAUTH_SCOPES=openid,email,profile,offline_access
```

### Azure AD

```env
OAUTH_ISSUER_URL=https://login.microsoftonline.com/your-tenant-id/v2.0
OAUTH_SCOPES=openid,email,profile,offline_access
```

### Google

```env
OAUTH_ISSUER_URL=https://accounts.google.com
OAUTH_SCOPES=openid,email,profile
```

Note: Google may not support `offline_access` - you might need to use `access_type=offline` in a custom implementation.

## Custom OAuth Server

If your OAuth server doesn't support OIDC discovery, the wrapper will fall back to standard paths. Ensure your server has endpoints at:

- Authorization: `{OAUTH_ISSUER_URL}/oauth2/v1/authorize`
- Token: `{OAUTH_ISSUER_URL}/oauth2/v1/token`

Or modify the fallback paths in `src/auth/oauth-handler.ts`.

## Testing

Test your configuration:

```bash
curl https://your-issuer-url/.well-known/openid-configuration
```

Should return JSON with `authorization_endpoint` and `token_endpoint`.

