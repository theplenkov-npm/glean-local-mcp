import { TokenData } from '../types/index.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class TokenManager {
  private tokenStoragePath: string;
  private tokenData: TokenData | null = null;

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
}

