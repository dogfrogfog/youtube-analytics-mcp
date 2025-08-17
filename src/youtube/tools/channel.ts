import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { YouTubeClient } from '../youtube-client.js';

export function registerChannelTools(server: McpServer, getYouTubeClient: () => Promise<YouTubeClient>) {
  // Get basic channel information
  server.tool(
    "get_channel_info",
    "Get information about the authenticated YouTube channel",
    {},
    async () => {
      try {
        const youtubeClient = await getYouTubeClient();
        const channelInfo = await youtubeClient.getChannelInfo();
        
        return {
          content: [{
            type: "text",
            text: `Channel Information:
Name: ${channelInfo.snippet.title}
ID: ${channelInfo.id}
Subscribers: ${parseInt(channelInfo.statistics.subscriberCount).toLocaleString()}
Total Views: ${parseInt(channelInfo.statistics.viewCount).toLocaleString()}
Video Count: ${parseInt(channelInfo.statistics.videoCount).toLocaleString()}
Published: ${new Date(channelInfo.snippet.publishedAt).toLocaleDateString()}
Description: ${channelInfo.snippet.description.slice(0, 200)}${channelInfo.snippet.description.length > 200 ? '...' : ''}`
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
}