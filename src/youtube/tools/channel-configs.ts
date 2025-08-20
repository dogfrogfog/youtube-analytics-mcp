import { z } from "zod";
import { ToolConfig, ToolContext } from '../../types.js';

export const channelToolConfigs: ToolConfig[] = [
  {
    name: "get_channel_info",
    description: "Get information about the authenticated YouTube channel",
    category: "channel",
    schema: z.object({}),
    handler: async (_, { getYouTubeClient }: ToolContext) => {
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
    handler: async ({ query, startDate, endDate, maxResults = 25 }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const videos = await youtubeClient.searchChannelVideos({
          query,
          startDate,
          endDate,
          maxResults: Math.min(maxResults, 50)
        });
        
        const videoList = videos.map((video: any) => ({
          videoId: video.id.videoId,
          title: video.snippet.title,
          publishedAt: new Date(video.snippet.publishedAt).toLocaleDateString(),
          description: video.snippet.description.slice(0, 100) + (video.snippet.description.length > 100 ? '...' : '')
        }));

        let filterText = '';
        if (query) filterText += `Query: "${query}" `;
        if (startDate) filterText += `From: ${startDate} `;
        if (endDate) filterText += `To: ${endDate} `;
        
        return {
          content: [{
            type: "text",
            text: `Channel Videos${filterText ? ` (${filterText.trim()})` : ''} - ${videoList.length} results:

${videoList.map((video: any) => 
`• Video ID: ${video.videoId}
  Title: ${video.title}
  Published: ${video.publishedAt}
  Description: ${video.description}
`).join('\n')}

Use the video IDs above with demographic analysis tools like get_video_demographics.`
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
