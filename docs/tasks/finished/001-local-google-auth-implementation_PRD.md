# YouTube MCP Authentication PRD (Minimalistic Single Account)

## Overview

This Product Requirements Document (PRD) outlines a minimalistic implementation of OAuth 2.0 authentication for a YouTube MCP (Model Context Protocol) server. This implementation supports a single YouTube account with read-only access to YouTube Data API, Analytics API, and YouTube Partner API.

## Directory Structure

```
your-youtube-mcp/
├── auth/
│   ├── credentials.json          # OAuth 2.0 client configuration
│   └── token.json               # Single account tokens
├── src/
│   ├── auth-manager.ts          # OAuth flow and token management
│   ├── youtube-client.ts        # YouTube API wrapper
│   ├── types.ts                 # Type definitions
│   └── index.ts                 # MCP server entry point
└── package.json
```

## Authentication Architecture

### 1. Credentials Configuration

Create `auth/credentials.json` with your Google Cloud Console OAuth 2.0 credentials:

```json
{
  "web": {
    "client_id": "YOUR_CLIENT_ID",
    "project_id": "YOUR_PROJECT_ID", 
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "YOUR_CLIENT_SECRET",
    "redirect_uris": ["http://localhost:3000/oauth2callback"]
  }
}
```

### 2. Token Storage

The single account token file at `auth/token.json`:

```json
{
  "type": "authorized_user",
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET", 
  "refresh_token": "REFRESH_TOKEN_HERE"
}
```

## Core Components

### 1. AuthManager Class

**File:** `src/auth-manager.ts`

**Purpose:** Handles OAuth 2.0 flow, token refresh, and authentication state for single account

**Key Features:**
- OAuth 2.0 desktop application flow
- Automatic token refresh
- Error handling for expired tokens
- Minimalistic single account design

**Required Scopes:**
```typescript
const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
  'https://www.googleapis.com/auth/youtubepartner'
];
```

**Implementation Structure:**
```typescript
export class AuthManager {
  private readonly AUTH_DIR = path.join(process.cwd(), 'auth');
  private readonly CREDENTIALS_PATH = path.join(this.AUTH_DIR, 'credentials.json');
  private readonly TOKEN_PATH = path.join(this.AUTH_DIR, 'token.json');
  private readonly SCOPES = [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/yt-analytics.readonly',
    'https://www.googleapis.com/auth/youtubepartner'
  ];
  
  async getAuthClient(): Promise<OAuth2Client>
  async authenticate(): Promise<OAuth2Client>
  private async refreshTokenIfNeeded(auth: OAuth2Client): Promise<void>
  private async saveToken(client: OAuth2Client): Promise<void>
}
```

### 2. YouTubeClient Class

**File:** `src/youtube-client.ts`

**Purpose:** Wrapper for YouTube APIs with authentication

**Implementation Structure:**
```typescript
export class YouTubeClient {
  private youtube: youtube_v3.Youtube;
  private youtubeAnalytics: youtubeAnalytics_v2.Youtubeanalytics;
  private auth: OAuth2Client;
  
  constructor(auth: OAuth2Client)
  
  // YouTube Data API methods
  async getChannelInfo(): Promise<any>
  async searchVideos(query: string, maxResults?: number): Promise<any>
  async getVideoDetails(videoId: string): Promise<any>
  
  // YouTube Analytics API methods
  async getChannelAnalytics(params: AnalyticsParams): Promise<any>
  async getVideoAnalytics(videoId: string, params: AnalyticsParams): Promise<any>
}
```

## OAuth 2.0 Flow Implementation

### 1. First-Time Authentication

```typescript
// Initial authentication flow
async authenticate(): Promise<OAuth2Client> {
  // 1. Ensure auth directory exists
  await fs.mkdir(this.AUTH_DIR, { recursive: true });
  
  // 2. Trigger OAuth flow
  const client = await authenticate({
    scopes: this.SCOPES,
    keyfilePath: this.CREDENTIALS_PATH,
  });
  
  // 3. Save tokens
  if (client.credentials) {
    await this.saveToken(client);
  }
  
  return client;
}
```

### 2. Token Refresh Logic

```typescript
async refreshTokenIfNeeded(auth: OAuth2Client): Promise<void> {
  if (auth?.credentials.expiry_date && 
      Date.now() >= auth.credentials.expiry_date) {
    try {
      const { credentials } = await auth.refreshAccessToken();
      auth.setCredentials(credentials);
      // Update stored token with new access token
      await this.updateStoredToken(auth);
    } catch (error) {
      throw new Error('Token refresh failed, re-authentication required');
    }
  }
}
```

### 3. Authentication Client Retrieval

```typescript
async getAuthClient(): Promise<OAuth2Client> {
  try {
    const content = await fs.readFile(this.TOKEN_PATH, 'utf8');
    const credentials = JSON.parse(content);
    const auth = google.auth.fromJSON(credentials) as OAuth2Client;
    
    // Refresh token if needed
    await this.refreshTokenIfNeeded(auth);
    
    return auth;
  } catch (error) {
    // If no token exists, trigger authentication
    return await this.authenticate();
  }
}
```

## Security Considerations

### 1. File Permissions

- Set restrictive permissions on credential and token files
- Use `chmod 600` on sensitive files to restrict access to owner only
- Never commit credential or token files to version control

### 2. Token Storage

- Store tokens separately per account
- Use refresh tokens for long-term access
- Implement automatic token refresh before expiry
- Handle token revocation gracefully

### 3. Error Handling

```typescript
// Simple error handling for auth failures
try {
  const auth = await authManager.getAuthClient();
  return new YouTubeClient(auth);
} catch (error) {
  throw new Error('Authentication failed. Please check your credentials and try again.');
}
```

### 4. Scope Management

```typescript
// Minimal required scopes for YouTube MCP
const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',    // Read channel/video data
  'https://www.googleapis.com/auth/yt-analytics.readonly', // Read analytics data
  'https://www.googleapis.com/auth/youtubepartner'       // Partner API access
];
```

## MCP Integration

### 1. Simple MCP Tools

```typescript
// Helper function to get YouTube client
async function getYouTubeClient(): Promise<YouTubeClient> {
  const auth = await authManager.getAuthClient();
  return new YouTubeClient(auth);
}

// Example MCP tool implementation
server.tool(
  "get_channel_analytics",
  {
    startDate: z.string().describe("Start date (YYYY-MM-DD)"),
    endDate: z.string().describe("End date (YYYY-MM-DD)"),
    metrics: z.array(z.string()).describe("Metrics to retrieve")
  },
  async ({ startDate, endDate, metrics }) => {
    try {
      const youtubeClient = await getYouTubeClient();
      const analytics = await youtubeClient.getChannelAnalytics({
        startDate,
        endDate, 
        metrics
      });
      return {
        content: [{
          type: "text",
          text: `Channel Analytics:\n${JSON.stringify(analytics, null, 2)}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);
```

## Dependencies

Add these to your `package.json`:

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.15.0",
    "googleapis": "^128.0.0",
    "@google-cloud/local-auth": "^2.1.0",
    "google-auth-library": "^9.0.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.8.0",
    "tsx": "^4.0.0"
  }
}
```

## Development Workflow

### 1. Initial Setup

```bash
# Install dependencies
npm install

# Create auth directory
mkdir -p auth

# Place credentials.json in auth/ directory
# (Download from Google Cloud Console)
```

### 2. OAuth 2.0 Credentials Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable YouTube Data API v3 and YouTube Analytics API
4. Create OAuth 2.0 credentials (Desktop Application)
5. Download credentials and save as `auth/credentials.json`

### 3. Testing Authentication

```typescript
// Test script for authentication
import { AuthManager } from './src/auth-manager.js';

const authManager = new AuthManager();

// Test authentication
const auth = await authManager.getAuthClient();
console.log('Authentication successful!');
```

### 4. Build and Run

```bash
# Build TypeScript
npm run build

# Test with MCP inspector
npm run inspect

# Development with hot reload
npm run dev
```

## Error Handling Patterns

### 1. Authentication Errors

```typescript
export class AuthenticationError extends Error {
  constructor(message: string, public account?: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor(account: string) {
    super(`Token expired for account ${account}`, account);
    this.name = 'TokenExpiredError';
  }
}
```

### 2. Quota and Rate Limiting

```typescript
export class QuotaExceededError extends Error {
  constructor(quotaType: string) {
    super(`YouTube API quota exceeded: ${quotaType}`);
    this.name = 'QuotaExceededError';
  }
}

// Handle rate limiting with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('Max retries exceeded');
}
```

## Testing Guidelines

### 1. Unit Tests

```typescript
// Test authentication
describe('AuthManager', () => {
  test('should authenticate successfully', async () => {
    const manager = new AuthManager();
    const auth = await manager.getAuthClient();
    expect(auth).toBeDefined();
    expect(auth.credentials).toBeDefined();
  });
});
```

### 2. Integration Tests

```typescript
// Test YouTube API integration
describe('YouTubeClient', () => {
  test('should retrieve channel info', async () => {
    const authManager = new AuthManager();
    const auth = await authManager.getAuthClient();
    const client = new YouTubeClient(auth);
    const channelInfo = await client.getChannelInfo();
    expect(channelInfo).toBeDefined();
  });
});
```

### 3. MCP Inspector Testing

Use the MCP Inspector to test authentication flow:

```bash
npm run inspect
```

Test the following scenarios:
- Initial authentication (triggers OAuth flow)
- Use YouTube API tools
- Handle authentication errors
- Token refresh functionality

## Deployment Considerations

### 1. Environment Configuration

```typescript
// Environment-specific configurations
const CONFIG = {
  development: {
    authDir: './auth',
    logLevel: 'debug'
  },
  production: {
    authDir: process.env.AUTH_DIR || './auth',
    logLevel: 'info'
  }
};
```

### 2. Security Hardening

- Use environment variables for sensitive configuration
- Implement proper logging without exposing tokens
- Set up file system permissions correctly
- Consider using secure credential storage (e.g., OS keychain)

## Future Enhancements

1. **Credential Encryption**: Encrypt stored tokens at rest
2. **Token Rotation**: Implement automatic token rotation
3. **Audit Logging**: Track authentication events

This minimalistic PRD provides a simple foundation for implementing OAuth 2.0 authentication in your YouTube MCP server with a single account approach.