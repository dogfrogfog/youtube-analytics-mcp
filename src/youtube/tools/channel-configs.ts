import { z } from "zod";
import { ToolConfig, ToolContext, Formatters } from '../../types.js';

// Formatters for channel-related data presentation
const channelFormatters: Formatters = {
  channelInfo: (channelInfo: any): string => {
    if (!channelInfo) {
      return "No channel information available.";
    }

    let output = "📺 Channel Information:\n\n";
    output += `🏷️ Name: ${channelInfo.snippet?.title || 'N/A'}\n`;
    output += `🆔 Channel ID: ${channelInfo.id || 'N/A'}\n`;
    
    // Format statistics with proper number formatting
    if (channelInfo.statistics) {
      const stats = channelInfo.statistics;
      output += `👥 Subscribers: ${parseInt(stats.subscriberCount || '0').toLocaleString()}\n`;
      output += `👁️ Total Views: ${parseInt(stats.viewCount || '0').toLocaleString()}\n`;
      output += `📹 Video Count: ${parseInt(stats.videoCount || '0').toLocaleString()}\n`;
    }
    
    if (channelInfo.snippet?.publishedAt) {
      output += `📅 Published: ${new Date(channelInfo.snippet.publishedAt).toLocaleDateString()}\n`;
    }
    
    if (channelInfo.snippet?.customUrl) {
      output += `🔗 Custom URL: ${channelInfo.snippet.customUrl}\n`;
    }
    
    if (channelInfo.snippet?.country) {
      output += `🌍 Country: ${channelInfo.snippet.country}\n`;
    }
    
    if (channelInfo.snippet?.description) {
      const desc = channelInfo.snippet.description;
      output += `\n📝 Description:\n${desc.slice(0, 300)}${desc.length > 300 ? '...' : ''}`;
    }

    return output;
  },

  videoList: (data: { videos: any[], filterOptions?: any }): string => {
    const { videos, filterOptions } = data;
    if (!videos || videos.length === 0) {
      return "No videos found matching the specified criteria.";
    }

    let output = "📹 Channel Videos:\n\n";
    
    // Add filter information if provided
    if (filterOptions && (filterOptions.query || filterOptions.startDate || filterOptions.endDate)) {
      output += "🔍 Filters Applied:\n";
      if (filterOptions.query) output += `  • Search Query: "${filterOptions.query}"\n`;
      if (filterOptions.startDate) output += `  • Start Date: ${filterOptions.startDate}\n`;
      if (filterOptions.endDate) output += `  • End Date: ${filterOptions.endDate}\n`;
      output += "\n";
    }
    
    output += `Found ${videos.length} videos:\n\n`;
    
    videos.forEach((video: any, index: number) => {
      output += `${index + 1}. 📺 ${video.snippet?.title || 'Untitled'}\n`;
      output += `   🆔 Video ID: ${video.id?.videoId || video.videoId || 'N/A'}\n`;
      
      if (video.snippet?.publishedAt) {
        output += `   📅 Published: ${new Date(video.snippet.publishedAt).toLocaleDateString()}\n`;
      }
      
      if (video.snippet?.description) {
        const desc = video.snippet.description.trim();
        if (desc) {
          output += `   📝 Description: ${desc.slice(0, 100)}${desc.length > 100 ? '...' : ''}\n`;
        }
      }
      
      output += "\n";
    });

    output += "💡 Use the video IDs above with other tools like get_video_demographics for detailed analysis.";
    
    return output;
  }
};

export const channelTools: ToolConfig[] = [
  {
    name: "get_channel_info",
    description: "Get information about the authenticated YouTube channel",
    category: "channel",
    schema: z.object({}),
    formatters: channelFormatters,
    handler: async (_, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const channelInfo = await youtubeClient.getChannelInfo();
        const formattedText = channelFormatters.channelInfo(channelInfo);
        
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
    name: "get_channel_videos",
    description: "Get list of channel videos with optional filters for demographic analysis",
    category: "channel",
    schema: z.object({
      query: z.string().optional().describe("Optional search query to filter videos"),
      startDate: z.string().optional().describe("Optional start date (YYYY-MM-DD)"),
      endDate: z.string().optional().describe("Optional end date (YYYY-MM-DD)"),
      maxResults: z.number().optional().default(25).describe("Number of videos to return (default 25, max 50)")
    }),
    formatters: channelFormatters,
    handler: async ({ query, startDate, endDate, maxResults = 25 }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const videos = await youtubeClient.searchChannelVideos({
          query,
          startDate,
          endDate,
          maxResults: Math.min(maxResults, 50)
        });
        
        const formattedText = channelFormatters.videoList({ videos, filterOptions: { query, startDate, endDate } });
        
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
];
