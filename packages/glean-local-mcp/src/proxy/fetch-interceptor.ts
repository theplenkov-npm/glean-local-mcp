/**
 * HTTP interceptor using undici's setGlobalDispatcher API
 * This intercepts ALL HTTP requests at the network layer (fetch, https, etc.)
 * 
 * SECURITY:
 * 1. Reads token from ~/.glean/tokens.json (not from env vars)
 * 2. Only injects token for requests to the EXACT domain configured in ~/.glean/config.json
 * 3. Prevents token theft via malicious domains like "glean.com.attacker.com"
 */
import { Agent, setGlobalDispatcher } from 'undici';
import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// Securely read token from file (not from environment variables)
function getToken(): string | null {
  try {
    const tokenPath = join(homedir(), '.glean', 'tokens.json');
    const tokenData = JSON.parse(readFileSync(tokenPath, 'utf-8'));
    return tokenData.access_token || null;
  } catch (error) {
    console.error('[Undici Interceptor] Failed to read token:', error);
    return null;
  }
}

// Get the authorized Glean domain from config
function getAuthorizedDomain(): string | null {
  try {
    const configPath = join(homedir(), '.glean', 'config.json');
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    if (config.apiBaseUrl) {
      // Extract hostname from URL (e.g., "https://company-be.glean.com" -> "company-be.glean.com")
      const url = new URL(config.apiBaseUrl);
      return url.hostname;
    }
  } catch (error) {
    // Config file might not exist, that's okay
  }
  return null;
}

// SECURITY: Validate that the request is going to the exact authorized domain
function isAuthorizedRequest(origin: string): boolean {
  const authorizedDomain = getAuthorizedDomain();
  if (!authorizedDomain) {
    return false;
  }
  
  try {
    const requestUrl = new URL(origin);
    // CRITICAL: Must match EXACTLY, not just contain the string
    // This prevents attacks like "glean.com.attacker.com" or "evil.com/glean.com"
    return requestUrl.hostname === authorizedDomain;
  } catch (error) {
    return false;
  }
}

// Create a custom dispatcher that intercepts requests
class GleanOAuthAgent extends Agent {
  override dispatch(options: any, handler: any) {
    // Get the origin (URL) to check if it's a Glean request
    const origin = typeof options.origin === 'string' ? options.origin : options.origin?.href || '';
    
    if (isAuthorizedRequest(origin)) {
      const token = getToken(); // Read fresh token on each request
      
      if (token) {
        // In undici, headers can be an array of strings or an object
        // We need to convert to array format: ['header-name', 'header-value', ...]
        const headers = [];
        
        // Copy existing headers if they exist
        if (Array.isArray(options.headers)) {
          headers.push(...options.headers);
        } else if (options.headers && typeof options.headers === 'object') {
          for (const [key, value] of Object.entries(options.headers)) {
            headers.push(key, value);
          }
        }
        
        // Add our OAuth headers
        headers.push('Authorization', `Bearer ${token}`);
        headers.push('X-Glean-Auth-Type', 'OAUTH');
        
        // Replace headers with our modified array
        options.headers = headers;
        
        console.error(`[Undici Interceptor] Injecting OAuth headers for ${origin}${options.path || ''}`);
      } else {
        console.error(`[Undici Interceptor] WARNING: No token available for ${origin}`);
      }
    }
    
    // Call the original dispatch
    return super.dispatch(options, handler);
  }
}

// Set our custom agent as the global dispatcher
setGlobalDispatcher(new GleanOAuthAgent());

console.error('[Undici Interceptor] Global HTTP dispatcher configured (secure token loading from ~/.glean/tokens.json)');
