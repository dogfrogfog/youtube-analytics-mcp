import { OAuth2Client } from 'google-auth-library';
import { google, youtube_v3, youtubeAnalytics_v2 } from 'googleapis';
import { 
  AnalyticsParams, 
  VideoAnalyticsParams, 
  ChannelInfo, 
  VideoInfo, 
  SearchResult,
  QuotaExceededError,
  RateLimitError 
} from './types.js';

export class YouTubeClient {
  private youtube: youtube_v3.Youtube;
  private youtubeAnalytics: youtubeAnalytics_v2.Youtubeanalytics;
  private auth: OAuth2Client;

  constructor(auth: OAuth2Client) {
    this.auth = auth;
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
          customUrl: channel.snippet!.customUrl,
          publishedAt: channel.snippet!.publishedAt!,
          thumbnails: channel.snippet!.thumbnails!,
          country: channel.snippet!.country
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
          videoId: item.id!.videoId,
          channelId: item.id!.channelId,
          playlistId: item.id!.playlistId
        },
        snippet: {
          publishedAt: item.snippet!.publishedAt!,
          channelId: item.snippet!.channelId!,
          title: item.snippet!.title!,
          description: item.snippet!.description!,
          thumbnails: item.snippet!.thumbnails!,
          channelTitle: item.snippet!.channelTitle!,
          liveBroadcastContent: item.snippet!.liveBroadcastContent!,
          publishTime: item.snippet!.publishTime!
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
          thumbnails: video.snippet!.thumbnails!,
          channelTitle: video.snippet!.channelTitle!,
          tags: video.snippet!.tags,
          categoryId: video.snippet!.categoryId!,
          liveBroadcastContent: video.snippet!.liveBroadcastContent!,
          defaultLanguage: video.snippet!.defaultLanguage,
          defaultAudioLanguage: video.snippet!.defaultAudioLanguage
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
          regionRestriction: video.contentDetails!.regionRestriction
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
          videoId: item.id!.videoId,
          channelId: item.id!.channelId,
          playlistId: item.id!.playlistId
        },
        snippet: {
          publishedAt: item.snippet!.publishedAt!,
          channelId: item.snippet!.channelId!,
          title: item.snippet!.title!,
          description: item.snippet!.description!,
          thumbnails: item.snippet!.thumbnails!,
          channelTitle: item.snippet!.channelTitle!,
          liveBroadcastContent: item.snippet!.liveBroadcastContent!,
          publishTime: item.snippet!.publishTime!
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
}