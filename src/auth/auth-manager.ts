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

  private authClient: OAuth2Client | null = null;

  constructor() {
  }

  async getAuthClient(): Promise<OAuth2Client> {
    // Return cached client if available and valid
    if (this.authClient) {
      try {
        await this.refreshTokenIfNeeded(this.authClient);
        return this.authClient;
      } catch (error) {
        console.log('Cached auth client invalid, creating new one...');
        this.authClient = null;
      }
    }

    try {
      // Try to load existing token
      const content = await fs.readFile(this.TOKEN_PATH, 'utf8');
      const tokenData: TokenData = JSON.parse(content);
      
      // Load credentials to get client_id and client_secret
      const credentialsContent = await fs.readFile(this.CREDENTIALS_PATH, 'utf8');
      const credentials: AuthConfig = JSON.parse(credentialsContent);
      
      // Create OAuth2Client with proper credentials
      this.authClient = new OAuth2Client(
        credentials.web.client_id,
        credentials.web.client_secret,
        credentials.web.redirect_uris[0]
      );
      
      // Set the stored tokens
      this.authClient.setCredentials({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expiry_date: tokenData.expiry_date
      });
      
      // Refresh token if needed
      await this.refreshTokenIfNeeded(this.authClient);
      
      return this.authClient;
    } catch (error) {
      // If no token exists or loading fails, trigger authentication
      console.log('No valid token found, initiating authentication flow...');
      this.authClient = null;
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

      console.log('Auth manager CREDENTIALS_PATH', this.CREDENTIALS_PATH);

      // Trigger OAuth flow using local-auth
      const client = await authenticate({
        scopes: this.SCOPES,
        keyfilePath: this.CREDENTIALS_PATH,
      });

      // Save tokens
      if (client.credentials) {
        this.authClient = client as unknown as OAuth2Client;
        await this.saveToken(this.authClient);
        console.log('Authentication successful! Tokens saved.');
      }

      return this.authClient || (client as unknown as OAuth2Client);
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

      if (!expiryDate || expiryDate <= fiveMinutesFromNow) {
        console.log('Token expired or expiring soon, refreshing...');
        
        // Ensure we have a refresh token
        if (!auth.credentials.refresh_token) {
          console.error('No refresh token available');
          throw new TokenExpiredError('No refresh token available');
        }
        
        const { credentials } = await auth.refreshAccessToken();
        auth.setCredentials(credentials);
        
        // Update stored token with new access token
        await this.updateStoredToken(auth);
        
        console.log('Token refreshed successfully');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear the cached client so we don't keep using invalid tokens
      this.authClient = null;
      throw new TokenExpiredError('Token refresh failed - please re-authenticate');
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
      
      // Clear cached client
      this.authClient = null;
      
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