import { authenticate } from '@google-cloud/local-auth';
import { promises as fs } from 'fs';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';
import { AuthConfig, AuthenticationError, TokenData, TokenExpiredError } from './types.js';

export class AuthManager {
  private readonly AUTH_DIR = path.join(process.cwd(), 'src', 'auth');
  private readonly CREDENTIALS_PATH = path.join(this.AUTH_DIR, 'credentials.json');
  private readonly TOKEN_PATH = path.join(this.AUTH_DIR, 'token.json');
  private readonly SCOPES = [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/yt-analytics.readonly',
    'https://www.googleapis.com/auth/youtubepartner'
  ];

  constructor() {
  }

  async getAuthClient(): Promise<OAuth2Client> {
    try {
      // Try to load existing token
      const content = await fs.readFile(this.TOKEN_PATH, 'utf8');
      const tokenData: TokenData = JSON.parse(content);
      
      // Create OAuth2Client from stored credentials
      const { google } = await import('googleapis');
      const auth = google.auth.fromJSON(tokenData) as OAuth2Client;
      
      // Refresh token if needed
      await this.refreshTokenIfNeeded(auth);
      
      return auth;
    } catch (error) {
      // If no token exists or loading fails, trigger authentication
      console.log('No valid token found, initiating authentication flow...');
      return await this.authenticate();
    }
  }

  async authenticate(): Promise<OAuth2Client> {
    try {
      // Check if credentials file exists
      try {
        await fs.access(this.CREDENTIALS_PATH);
      } catch {
        throw new AuthenticationError(
          `Credentials file not found at ${this.CREDENTIALS_PATH}. ` +
          'Please place your Google OAuth credentials in src/auth/credentials.json'
        );
      }

      // Trigger OAuth flow using local-auth
      const client = await authenticate({
        scopes: this.SCOPES,
        keyfilePath: this.CREDENTIALS_PATH,
      });

      // Save tokens
      if (client.credentials) {
        await this.saveToken(client as unknown as OAuth2Client);
        console.log('Authentication successful! Tokens saved.');
      }

      return client as unknown as OAuth2Client;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError(`Authentication failed: ${error}`);
    }
  }

  private async refreshTokenIfNeeded(auth: OAuth2Client): Promise<void> {
    try {
      // Check if token is expired or about to expire (within 5 minutes)
      const now = Date.now();
      const expiryDate = auth.credentials.expiry_date;
      const fiveMinutesFromNow = now + (5 * 60 * 1000);

      if (expiryDate && expiryDate <= fiveMinutesFromNow) {
        console.log('Token expired or expiring soon, refreshing...');
        
        const { credentials } = await auth.refreshAccessToken();
        auth.setCredentials(credentials);
        
        // Update stored token with new access token
        await this.updateStoredToken(auth);
        
        console.log('Token refreshed successfully');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new TokenExpiredError('default');
    }
  }

  private async saveToken(client: OAuth2Client): Promise<void> {
    try {
      // Read credentials to get client_id and client_secret
      const credentialsContent = await fs.readFile(this.CREDENTIALS_PATH, 'utf8');
      const credentials: AuthConfig = JSON.parse(credentialsContent);

      const tokenData: TokenData = {
        type: 'authorized_user',
        client_id: credentials.web.client_id,
        client_secret: credentials.web.client_secret,
        refresh_token: client.credentials.refresh_token!,
        access_token: client.credentials.access_token || undefined,
        expiry_date: client.credentials.expiry_date || undefined
      };

      await fs.writeFile(this.TOKEN_PATH, JSON.stringify(tokenData, null, 2));
      
      // Set restrictive permissions on token file
      await fs.chmod(this.TOKEN_PATH, 0o600);
    } catch (error) {
      throw new AuthenticationError(`Failed to save token: ${error}`);
    }
  }

  private async updateStoredToken(auth: OAuth2Client): Promise<void> {
    try {
      const content = await fs.readFile(this.TOKEN_PATH, 'utf8');
      const tokenData: TokenData = JSON.parse(content);
      
      // Update with new access token and expiry
      tokenData.access_token = auth.credentials.access_token || undefined;
      tokenData.expiry_date = auth.credentials.expiry_date || undefined;
      
      await fs.writeFile(this.TOKEN_PATH, JSON.stringify(tokenData, null, 2));
    } catch (error) {
      throw new AuthenticationError(`Failed to update stored token: ${error}`);
    }
  }

  async revokeToken(): Promise<void> {
    try {
      const auth = await this.getAuthClient();
      await auth.revokeCredentials();
      
      // Remove stored token file
      try {
        await fs.unlink(this.TOKEN_PATH);
        console.log('Token revoked and removed successfully');
      } catch (error) {
        console.warn('Failed to remove token file:', error);
      }
    } catch (error) {
      throw new AuthenticationError(`Failed to revoke token: ${error}`);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const auth = await this.getAuthClient();
      return !!auth.credentials.access_token;
    } catch {
      return false;
    }
  }
}