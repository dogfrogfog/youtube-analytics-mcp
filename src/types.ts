import { OAuth2Client } from 'google-auth-library';

export interface AuthConfig {
  web: {
    client_id: string;
    project_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_secret: string;
    redirect_uris: string[];
  };
}

export interface TokenData {
  type: 'authorized_user';
  client_id: string;
  client_secret: string;
  refresh_token: string;
  access_token?: string;
  expiry_date?: number;
}

export interface AnalyticsParams {
  startDate: string;
  endDate: string;
  metrics: string[];
  dimensions?: string[];
  filters?: string;
  maxResults?: number;
  sort?: string;
}

export interface VideoAnalyticsParams extends AnalyticsParams {
  videoId: string;
}

export interface ChannelInfo {
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl?: string;
    publishedAt: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
    country?: string;
  };
  statistics: {
    viewCount: string;
    subscriberCount: string;
    hiddenSubscriberCount: boolean;
    videoCount: string;
  };
}

export interface VideoInfo {
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
      standard?: { url: string };
      maxres?: { url: string };
    };
    channelTitle: string;
    tags?: string[];
    categoryId: string;
    liveBroadcastContent: string;
    defaultLanguage?: string;
    defaultAudioLanguage?: string;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    favoriteCount: string;
    commentCount: string;
  };
  contentDetails: {
    duration: string;
    dimension: string;
    definition: string;
    caption: string;
    licensedContent: boolean;
    regionRestriction?: {
      allowed?: string[];
      blocked?: string[];
    };
  };
}

export interface SearchResult {
  kind: string;
  etag: string;
  id: {
    kind: string;
    videoId?: string;
    channelId?: string;
    playlistId?: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
    channelTitle: string;
    liveBroadcastContent: string;
    publishTime: string;
  };
}

// Error types
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

export class QuotaExceededError extends Error {
  constructor(quotaType: string) {
    super(`YouTube API quota exceeded: ${quotaType}`);
    this.name = 'QuotaExceededError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}