import { z } from "zod";
import { ToolConfig, ToolContext } from '../../types.js';
import { formatPublicChannelInfo, formatPublicChannelVideos } from '../../utils/formatters/competitor.js';

export const competitorTools: ToolConfig[] = [
  {
    name: "get_public_channel_stats",
    description: "Get public statistics for any YouTube channel (subscribers, views, video count)",
    category: "competitor",
    schema: z.object({
      channelId: z.string().describe("YouTube channel ID to analyze")
    }),
    handler: async ({ channelId }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const channelInfo = await youtubeClient.getPublicChannelInfo(channelId);
        const formattedText = formatPublicChannelInfo(channelInfo);
        
        return {
          content: [{
            type: "text",
            text: formattedText
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
    },
  },
  {
    name: "get_public_channel_videos",
    description: "Get recent videos from any YouTube channel with basic statistics",
    category: "competitor",
    schema: z.object({
      channelId: z.string().describe("YouTube channel ID to get videos from"),
      maxResults: z.number().optional().default(25).describe("Number of videos to return (default 25, max 50)")
    }),
    handler: async ({ channelId, maxResults = 25 }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const videos = await youtubeClient.getPublicChannelVideos(channelId, Math.min(maxResults, 50));
        
        // Get detailed video stats for each video
        const videoIds = videos.map((v: any) => v.id.videoId).filter(Boolean) as string[];
        const videoDetails = await Promise.all(
          videoIds.map((videoId: string) => youtubeClient.getVideoDetails(videoId))
        );
        
        const formattedText = formatPublicChannelVideos({
          videos: videoDetails,
          channelId
        });
        
        return {
          content: [{
            type: "text",
            text: formattedText
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
    },
  },
  {
    name: "compare_channels",
    description: "Compare public statistics between multiple YouTube channels",
    category: "competitor",
    schema: z.object({
      channelIds: z.array(z.string()).min(2).max(10).describe("Array of YouTube channel IDs to compare (2-10 channels)")
    }),
    handler: async ({ channelIds }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const channelData = await Promise.all(
          channelIds.map((channelId: string) => youtubeClient.getPublicChannelInfo(channelId))
        );
        
        // Format comparison data
        let comparison = `## Channel Comparison\n\n`;
        comparison += `| Channel | Subscribers | Views | Videos | Created |\n`;
        comparison += `|---------|-------------|-------|--------|---------|\n`;
        
        channelData.forEach(channel => {
          const subscribers = parseInt(channel.statistics.subscriberCount).toLocaleString();
          const views = parseInt(channel.statistics.viewCount).toLocaleString();
          const videos = parseInt(channel.statistics.videoCount).toLocaleString();
          const created = new Date(channel.snippet.publishedAt).toLocaleDateString();
          
          comparison += `| ${channel.snippet.title} | ${subscribers} | ${views} | ${videos} | ${created} |\n`;
        });
        
        // Calculate averages and rankings
        const sortedBySubscribers = [...channelData].sort((a, b) => 
          parseInt(b.statistics.subscriberCount) - parseInt(a.statistics.subscriberCount)
        );
        
        comparison += `\n### Rankings by Subscribers:\n`;
        sortedBySubscribers.forEach((channel, index) => {
          comparison += `${index + 1}. **${channel.snippet.title}** - ${parseInt(channel.statistics.subscriberCount).toLocaleString()} subscribers\n`;
        });
        
        const sortedByViews = [...channelData].sort((a, b) => 
          parseInt(b.statistics.viewCount) - parseInt(a.statistics.viewCount)
        );
        
        comparison += `\n### Rankings by Total Views:\n`;
        sortedByViews.forEach((channel, index) => {
          comparison += `${index + 1}. **${channel.snippet.title}** - ${parseInt(channel.statistics.viewCount).toLocaleString()} total views\n`;
        });
        
        return {
          content: [{
            type: "text",
            text: comparison
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
    },
  },
];