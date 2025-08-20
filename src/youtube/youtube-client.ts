import { OAuth2Client } from 'google-auth-library';
import { google, youtube_v3, youtubeAnalytics_v2 } from 'googleapis';
import {
  AnalyticsParams,
  ChannelInfo,
  QuotaExceededError,
  RateLimitError,
  SearchResult,
  VideoInfo,
  ComparisonResult,
  DemographicsParams,
  RetentionParams
} from './types.js';

export class YouTubeClient {
  private youtube: youtube_v3.Youtube;
  private youtubeAnalytics: youtubeAnalytics_v2.Youtubeanalytics;

  constructor(auth: OAuth2Client) {
    this.youtube = google.youtube({ version: 'v3', auth });
    this.youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth });
  }

  // YouTube Data API methods
  async getChannelInfo(): Promise<ChannelInfo> {
    try {
      const response = await this.withRetry(async () => {
        return await this.youtube.channels.list({
          part: ['snippet', 'statistics'],
          mine: true
        });
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('No channel found for the authenticated user');
      }

      const channel = response.data.items[0];
      return {
        id: channel.id!,
        snippet: {
          title: channel.snippet!.title!,
          description: channel.snippet!.description!,
          customUrl: channel.snippet!.customUrl || undefined,
          publishedAt: channel.snippet!.publishedAt!,
          thumbnails: this.transformThumbnails(channel.snippet!.thumbnails!),
          country: channel.snippet!.country || undefined
        },
        statistics: {
          viewCount: channel.statistics!.viewCount!,
          subscriberCount: channel.statistics!.subscriberCount!,
          hiddenSubscriberCount: channel.statistics!.hiddenSubscriberCount!,
          videoCount: channel.statistics!.videoCount!
        }
      };
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async searchVideos(query: string, maxResults: number = 25): Promise<SearchResult[]> {
    try {
      const response = await this.withRetry(async () => {
        return await this.youtube.search.list({
          part: ['snippet'],
          q: query,
          type: ['video'],
          maxResults,
          order: 'relevance'
        });
      });

      return response.data.items?.map(item => ({
        kind: item.kind!,
        etag: item.etag!,
        id: {
          kind: item.id!.kind!,
          videoId: item.id!.videoId || undefined,
          channelId: item.id!.channelId || undefined,
          playlistId: item.id!.playlistId || undefined
        },
        snippet: {
          publishedAt: item.snippet!.publishedAt!,
          channelId: item.snippet!.channelId!,
          title: item.snippet!.title!,
          description: item.snippet!.description!,
          thumbnails: this.transformSearchThumbnails(item.snippet!.thumbnails!),
          channelTitle: item.snippet!.channelTitle!,
          liveBroadcastContent: item.snippet!.liveBroadcastContent!,
          publishTime: item.snippet!.publishedAt!
        }
      })) || [];
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async getVideoDetails(videoId: string): Promise<VideoInfo> {
    try {
      const response = await this.withRetry(async () => {
        return await this.youtube.videos.list({
          part: ['snippet', 'statistics', 'contentDetails'],
          id: [videoId]
        });
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error(`Video not found: ${videoId}`);
      }

      const video = response.data.items[0];
      return {
        id: video.id!,
        snippet: {
          publishedAt: video.snippet!.publishedAt!,
          channelId: video.snippet!.channelId!,
          title: video.snippet!.title!,
          description: video.snippet!.description!,
          thumbnails: this.transformVideoThumbnails(video.snippet!.thumbnails!),
          channelTitle: video.snippet!.channelTitle!,
          tags: video.snippet!.tags || undefined,
          categoryId: video.snippet!.categoryId!,
          liveBroadcastContent: video.snippet!.liveBroadcastContent!,
          defaultLanguage: video.snippet!.defaultLanguage || undefined,
          defaultAudioLanguage: video.snippet!.defaultAudioLanguage || undefined
        },
        statistics: {
          viewCount: video.statistics!.viewCount!,
          likeCount: video.statistics!.likeCount!,
          favoriteCount: video.statistics!.favoriteCount!,
          commentCount: video.statistics!.commentCount!
        },
        contentDetails: {
          duration: video.contentDetails!.duration!,
          dimension: video.contentDetails!.dimension!,
          definition: video.contentDetails!.definition!,
          caption: video.contentDetails!.caption!,
          licensedContent: video.contentDetails!.licensedContent!,
          regionRestriction: this.transformRegionRestriction(video.contentDetails!.regionRestriction)
        }
      };
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async getChannelVideos(maxResults: number = 50): Promise<SearchResult[]> {
    try {
      // First get the channel info to get the channel ID
      const channelInfo = await this.getChannelInfo();
      
      const response = await this.withRetry(async () => {
        return await this.youtube.search.list({
          part: ['snippet'],
          channelId: channelInfo.id,
          type: ['video'],
          maxResults,
          order: 'date'
        });
      });

      return response.data.items?.map(item => ({
        kind: item.kind!,
        etag: item.etag!,
        id: {
          kind: item.id!.kind!,
          videoId: item.id!.videoId || undefined,
          channelId: item.id!.channelId || undefined,
          playlistId: item.id!.playlistId || undefined
        },
        snippet: {
          publishedAt: item.snippet!.publishedAt!,
          channelId: item.snippet!.channelId!,
          title: item.snippet!.title!,
          description: item.snippet!.description!,
          thumbnails: this.transformSearchThumbnails(item.snippet!.thumbnails!),
          channelTitle: item.snippet!.channelTitle!,
          liveBroadcastContent: item.snippet!.liveBroadcastContent!,
          publishTime: item.snippet!.publishedAt!
        }
      })) || [];
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async searchChannelVideos(params: {
    query?: string;
    startDate?: string;
    endDate?: string;
    maxResults?: number;
  }): Promise<SearchResult[]> {
    try {
      const { query, startDate, endDate, maxResults = 25 } = params;
      
      // First get the channel info to get the channel ID
      const channelInfo = await this.getChannelInfo();
      
      // Convert dates to RFC 3339 format if provided
      let publishedAfter: string | undefined;
      let publishedBefore: string | undefined;
      
      if (startDate) {
        publishedAfter = new Date(startDate + 'T00:00:00Z').toISOString();
      }
      
      if (endDate) {
        publishedBefore = new Date(endDate + 'T23:59:59Z').toISOString();
      }

      const response = await this.withRetry(async () => {
        return await this.youtube.search.list({
          part: ['snippet'],
          channelId: channelInfo.id,
          type: ['video'],
          maxResults,
          order: 'date',
          q: query,
          publishedAfter,
          publishedBefore
        });
      });

      return response.data.items?.map(item => ({
        kind: item.kind!,
        etag: item.etag!,
        id: {
          kind: item.id!.kind!,
          videoId: item.id!.videoId || undefined,
          channelId: item.id!.channelId || undefined,
          playlistId: item.id!.playlistId || undefined
        },
        snippet: {
          publishedAt: item.snippet!.publishedAt!,
          channelId: item.snippet!.channelId!,
          title: item.snippet!.title!,
          description: item.snippet!.description!,
          thumbnails: this.transformSearchThumbnails(item.snippet!.thumbnails!),
          channelTitle: item.snippet!.channelTitle!,
          liveBroadcastContent: item.snippet!.liveBroadcastContent!,
          publishTime: item.snippet!.publishedAt!
        }
      })) || [];
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  // YouTube Analytics API methods
  async getChannelAnalytics(params: AnalyticsParams): Promise<any> {
    try {
      const response = await this.withRetry(async () => {
        return await this.youtubeAnalytics.reports.query({
          startDate: params.startDate,
          endDate: params.endDate,
          metrics: params.metrics.join(','),
          dimensions: params.dimensions?.join(','),
          filters: params.filters,
          maxResults: params.maxResults,
          sort: params.sort,
          ids: 'channel==MINE'
        });
      });

      return {
        columnHeaders: response.data.columnHeaders,
        rows: response.data.rows,
        kind: response.data.kind
      };
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async getVideoAnalytics(videoId: string, params: AnalyticsParams): Promise<any> {
    try {
      const response = await this.withRetry(async () => {
        return await this.youtubeAnalytics.reports.query({
          startDate: params.startDate,
          endDate: params.endDate,
          metrics: params.metrics.join(','),
          dimensions: params.dimensions?.join(','),
          filters: `video==${videoId}`,
          maxResults: params.maxResults,
          sort: params.sort,
          ids: 'channel==MINE'
        });
      });

      return {
        videoId,
        columnHeaders: response.data.columnHeaders,
        rows: response.data.rows,
        kind: response.data.kind
      };
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  // Channel Health Check methods
  async getChannelOverview(params: { startDate: string; endDate: string }): Promise<any> {
    try {
      const response = await this.withRetry(async () => {
        return await this.youtubeAnalytics.reports.query({
          startDate: params.startDate,
          endDate: params.endDate,
          metrics: 'views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,subscribersLost',
          dimensions: 'day',
          ids: 'channel==MINE',
          sort: 'day'
        });
      });

      return {
        columnHeaders: response.data.columnHeaders,
        rows: response.data.rows,
        kind: response.data.kind,
        period: `${params.startDate} to ${params.endDate}`
      };
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async getComparisonMetrics(params: {
    metrics: string[];
    period1Start: string;
    period1End: string;
    period2Start: string;
    period2End: string;
  }): Promise<ComparisonResult<any>> {
    try {
      // Validate required parameters
      if (!params.metrics || !Array.isArray(params.metrics)) {
        throw new Error("metrics parameter is required and must be an array");
      }

      const [period1, period2] = await Promise.all([
        this.withRetry(async () => {
          return await this.youtubeAnalytics.reports.query({
            startDate: params.period1Start,
            endDate: params.period1End,
            metrics: params.metrics.join(','),
            ids: 'channel==MINE'
          });
        }),
        this.withRetry(async () => {
          return await this.youtubeAnalytics.reports.query({
            startDate: params.period2Start,
            endDate: params.period2End,
            metrics: params.metrics.join(','),
            ids: 'channel==MINE'
          });
        })
      ]);

      // Calculate percentage change for each metric
      const period1Data = period1.data;
      const period2Data = period2.data;
      
      let changePercent = 0;
      if (period1Data.rows && period2Data.rows && 
          period1Data.rows.length > 0 && period2Data.rows.length > 0) {
        // Simple comparison of first metric if available
        const period1Value = Number(period1Data.rows[0][0]) || 0;
        const period2Value = Number(period2Data.rows[0][0]) || 0;
        
        if (period2Value > 0) {
          changePercent = ((period1Value - period2Value) / period2Value) * 100;
        }
      }

      return {
        period1: {
          data: period1Data,
          period: `${params.period1Start} to ${params.period1End}`
        },
        period2: {
          data: period2Data,
          period: `${params.period2Start} to ${params.period2End}`
        },
        changePercent: Math.round(changePercent * 100) / 100
      };
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  // Demographics and Discovery methods
  async getDemographics(params: DemographicsParams): Promise<any> {
    const filters = params.videoId ? `video==${params.videoId}` : undefined;
    return this.getChannelAnalytics({
      ...params,
      metrics: ['viewerPercentage'],
      dimensions: ['ageGroup', 'gender'],
      filters,
      sort: 'gender,ageGroup'
    });
  }

  async getGeographicDistribution(params: DemographicsParams): Promise<any> {
    const filters = params.videoId ? `video==${params.videoId}` : undefined;
    return this.getChannelAnalytics({
      ...params,
      metrics: ['views', 'estimatedMinutesWatched', 'averageViewDuration'],
      dimensions: ['country'],
      filters,
      sort: '-views',
      maxResults: 50
    });
  }

  async getSubscriberAnalytics(params: DemographicsParams): Promise<any> {
    const filters = params.videoId ? `video==${params.videoId}` : undefined;
    return this.getChannelAnalytics({
      ...params,
      metrics: ['views', 'estimatedMinutesWatched', 'averageViewDuration'],
      dimensions: ['subscribedStatus'],
      filters
    });
  }

  async getTrafficSources(params: DemographicsParams): Promise<any> {
    const filters = params.videoId ? `video==${params.videoId}` : undefined;
    return this.getChannelAnalytics({
      ...params,
      metrics: ['views', 'estimatedMinutesWatched'],
      dimensions: ['insightTrafficSourceType'],
      filters,
      sort: '-views'
    });
  }

  async getSearchTerms(params: DemographicsParams & { videoId: string }): Promise<any> {
    return this.getChannelAnalytics({
      ...params,
      metrics: ['views'],
      dimensions: ['insightTrafficSourceDetail'],
      filters: `video==${params.videoId};insightTrafficSourceType==YT_SEARCH`,
      sort: '-views',
      maxResults: 25
    });
  }

  async getDeviceTypeAnalytics(params: DemographicsParams): Promise<any> {
    const filters = params.videoId ? `video==${params.videoId}` : undefined;
    return this.getChannelAnalytics({
      ...params,
      metrics: ['views', 'estimatedMinutesWatched', 'averageViewDuration'],
      dimensions: ['deviceType', 'operatingSystem'],
      filters,
      sort: '-views'
    });
  }

  async getOptimalPostingTime(params: { startDate: string; endDate: string }): Promise<any> {
    // YouTube Analytics API v2 doesn't support hour dimension
    // We'll analyze by day of week and provide strategic insights
    return await this.getChannelAnalytics({
      ...params,
      metrics: ['views', 'estimatedMinutesWatched', 'subscribersGained'],
      dimensions: ['day'],
      sort: 'day'
    });
  }



  // Content Performance Analytics methods
  async getAudienceRetention(params: RetentionParams): Promise<any> {
    return this.getVideoAnalytics(params.videoId, {
      ...params,
      metrics: ['audienceWatchRatio', 'relativeRetentionPerformance'],
      dimensions: ['elapsedVideoTimeRatio'],
      sort: 'elapsedVideoTimeRatio'
    });
  }

  async getWatchTimeMetrics(params: DemographicsParams): Promise<any> {
    // For video-specific analysis, use only supported metrics and dimensions
    if (params.videoId) {
      return this.getVideoAnalytics(params.videoId, {
        ...params,
        metrics: ['estimatedMinutesWatched', 'averageViewDuration', 'averageViewPercentage', 'views'],
        dimensions: ['day'],
        sort: 'day'
      });
    } else {
      // For channel-wide analysis
      return this.getChannelAnalytics({
        ...params,
        metrics: ['estimatedMinutesWatched', 'averageViewDuration', 'averageViewPercentage', 'views'],
        dimensions: ['day'],
        sort: 'day',
        maxResults: 100
      });
    }
  }

  async getPlaylistPerformance(params: DemographicsParams & { playlistId?: string }): Promise<any> {
    const filters = params.playlistId ? `playlist==${params.playlistId}` : undefined;
    
    return this.getChannelAnalytics({
      ...params,
      metrics: ['playlistStarts', 'viewsPerPlaylistStart', 'averageTimeInPlaylist'],
      dimensions: ['playlist'],
      filters,
      sort: '-playlistStarts',
      maxResults: 20
    });
  }

  async getViewerSessionTime(params: AnalyticsParams): Promise<any> {
    return this.getChannelAnalytics({
      ...params,
      metrics: ['estimatedMinutesWatched', 'averageViewDuration'],
      dimensions: ['day'],
      sort: 'day'
    });
  }

  // Engagement Analytics methods
  async getEngagementMetrics(params: { videoId?: string; startDate: string; endDate: string }): Promise<any> {
    const filter = params.videoId ? `video==${params.videoId}` : undefined;
    return this.getChannelAnalytics({
      ...params,
      metrics: ['likes', 'dislikes', 'comments', 'shares', 'subscribersGained', 'subscribersLost', 'views'],
      dimensions: ['day'],
      filters: filter,
      sort: 'day'
    });
  }

  async getSharingAnalytics(params: { videoId?: string; startDate: string; endDate: string }): Promise<any> {
    const filter = params.videoId ? `video==${params.videoId}` : undefined;
    return this.getChannelAnalytics({
      ...params,
      metrics: ['shares'],
      dimensions: ['sharingService'],
      filters: filter,
      sort: '-shares'
    });
  }

  async getCardEndScreenPerformance(params: { videoId: string; startDate: string; endDate: string }): Promise<any> {
    return this.getChannelAnalytics({
      ...params,
      metrics: ['cardImpressions', 'cardClicks', 'cardClickRate'],
      dimensions: ['video'],
      filters: `video==${params.videoId}`,
      sort: 'video'
    });
  }

  // Utility methods
  private async withRetry<T>(fn: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        if (i === maxRetries - 1) {
          throw error;
        }

        // Check if it's a rate limit error
        if (error.code === 429 || error.message?.includes('quotaExceeded')) {
          const delay = Math.pow(2, i) * 1000; // Exponential backoff
          console.log(`Rate limited, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }
    throw new Error('Max retries exceeded');
  }

  private handleApiError(error: any): void {
    if (error.code === 403) {
      if (error.message?.includes('quotaExceeded')) {
        throw new QuotaExceededError('Daily quota exceeded');
      }
      if (error.message?.includes('userRateLimitExceeded')) {
        throw new RateLimitError('User rate limit exceeded');
      }
    }
    
    if (error.code === 429) {
      throw new RateLimitError('Rate limit exceeded');
    }

    if (error.code === 401) {
      throw new Error('Authentication failed. Please re-authenticate.');
    }

    // Log the error for debugging
    console.error('YouTube API Error:', {
      code: error.code,
      message: error.message,
      errors: error.errors
    });
  }

  // Helper methods for type transformations
  private transformThumbnails(thumbnails: any, includeHighRes: boolean = false): any {
    const result: any = {
      default: thumbnails?.default?.url ? { url: thumbnails.default.url } : undefined,
      medium: thumbnails?.medium?.url ? { url: thumbnails.medium.url } : undefined,
      high: thumbnails?.high?.url ? { url: thumbnails.high.url } : undefined
    };
    
    if (includeHighRes) {
      result.standard = thumbnails?.standard?.url ? { url: thumbnails.standard.url } : undefined;
      result.maxres = thumbnails?.maxres?.url ? { url: thumbnails.maxres.url } : undefined;
    }
    
    return result;
  }

  private transformVideoThumbnails(thumbnails: any) {
    return this.transformThumbnails(thumbnails, true);
  }

  private transformSearchThumbnails(thumbnails: any) {
    return this.transformThumbnails(thumbnails, false);
  }

  private transformRegionRestriction(restriction: any): { allowed?: string[]; blocked?: string[] } | undefined {
    if (!restriction) return undefined;
    return {
      allowed: restriction.allowed || undefined,
      blocked: restriction.blocked || undefined
    };
  }
}