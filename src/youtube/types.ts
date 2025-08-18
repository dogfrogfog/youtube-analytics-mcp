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

// YouTube API Error types
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

// Channel Health Check types
export interface ChannelOverviewMetrics {
  views: number;
  estimatedMinutesWatched: number;
  averageViewDuration: number;
  subscribersGained: number;
  subscribersLost: number;
}

export interface ComparisonResult<T> {
  period1: T;
  period2: T;
  changePercent: number;
}

export interface ChannelHealthData {
  date: string;
  metrics: ChannelOverviewMetrics;
}

// Demographics and Discovery types
export interface DemographicsParams extends AnalyticsParams {
  videoId?: string;
}

export interface DemographicsData {
  ageGroup: string;
  gender: string;
  viewerPercentage: number;
}

export interface GeographicData {
  country: string;
  views: number;
  estimatedMinutesWatched: number;
  averageViewDuration: number;
}

export interface TrafficSourceData {
  sourceType: string;
  views: number;
  estimatedMinutesWatched: number;
}