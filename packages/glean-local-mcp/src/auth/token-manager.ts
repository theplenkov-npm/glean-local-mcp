import { TokenData } from '../types/index.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export type TokenChangeCallback = (tokenData: TokenData) => void;

export class TokenManager {
  private tokenStoragePath: string;
  private tokenData: TokenData | null = null;
  private watcher: fs.FSWatcher | null = null;
  private onTokenChange: TokenChangeCallback | null = null;
  private ignoreNextChange = false;

  constructor(tokenStoragePath: string) {
    this.tokenStoragePath = path.resolve(tokenStoragePath);
    this.loadTokens();
  }

  private loadTokens(): void {
    try {
      if (fs.existsSync(this.tokenStoragePath)) {
        const data = fs.readFileSync(this.tokenStoragePath, 'utf-8');
        this.tokenData = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
      this.tokenData = null;
    }
  }

  /**
   * Reload tokens from disk. Returns true if new token data was loaded.
   */
  public reloadTokens(): boolean {
    const previousRefresh = this.tokenData?.refresh_token;
    this.loadTokens();
    return this.tokenData?.refresh_token !== previousRefresh;
  }

  public saveTokens(tokenData: TokenData): void {
    this.tokenData = {
      ...tokenData,
      issued_at: Date.now()
    };

    try {
      const dir = path.dirname(this.tokenStoragePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Suppress the file-watcher callback for our own writes
      this.ignoreNextChange = true;
      fs.writeFileSync(
        this.tokenStoragePath,
        JSON.stringify(this.tokenData, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Error saving tokens:', error);
      throw error;
    }
  }

  public getAccessToken(): string | null {
    if (!this.tokenData) {
      return null;
    }

    // Check if token is expired (with 5 minute buffer)
    const expiresAt = this.tokenData.issued_at + (this.tokenData.expires_in * 1000);
    const now = Date.now();
    const buffer = 5 * 60 * 1000; // 5 minutes

    if (now + buffer >= expiresAt) {
      return null; // Token expired or about to expire
    }

    return this.tokenData.access_token;
  }

  public getRefreshToken(): string | null {
    return this.tokenData?.refresh_token || null;
  }

  public hasValidTokens(): boolean {
    return this.getAccessToken() !== null;
  }

  public clearTokens(): void {
    this.tokenData = null;
    try {
      if (fs.existsSync(this.tokenStoragePath)) {
        fs.unlinkSync(this.tokenStoragePath);
      }
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  public getTokenData(): TokenData | null {
    return this.tokenData;
  }

  /**
   * Watch the token file for external changes (e.g. container operator
   * mounting a fresh refresh token). Calls the callback when new token
   * data is detected that differs from the current in-memory state.
   */
  public watchTokenFile(callback: TokenChangeCallback): void {
    this.onTokenChange = callback;

    // Ensure the directory exists so fs.watch can attach
    const dir = path.dirname(this.tokenStoragePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Watch the directory (more reliable for file replacement / atomic writes)
    const basename = path.basename(this.tokenStoragePath);
    this.watcher = fs.watch(dir, (eventType, filename) => {
      if (filename !== basename) return;
      if (this.ignoreNextChange) {
        this.ignoreNextChange = false;
        return;
      }
      // Small debounce – some editors write multiple events
      setTimeout(() => {
        if (this.reloadTokens() && this.tokenData) {
          this.onTokenChange?.(this.tokenData);
        }
      }, 200);
    });

    this.watcher.on('error', (err) => {
      console.error('Token file watcher error:', err);
    });
  }

  /**
   * Stop watching the token file.
   */
  public stopWatching(): void {
    this.watcher?.close();
    this.watcher = null;
    this.onTokenChange = null;
  }
}

