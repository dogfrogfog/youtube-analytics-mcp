import { z } from "zod";
import { ToolConfig, ToolContext } from '../../types.js';
import { formatTrendingVideos } from '../../utils/formatters/trends.js';

export const trendsTools: ToolConfig[] = [
  {
    name: "get_trending_videos",
    description: "Get trending/most popular videos globally or by country",
    category: "trends",
    schema: z.object({
      regionCode: z.string().optional().describe("ISO 3166-1 alpha-2 country code (e.g., US, GB, JP)"),
      categoryId: z.string().optional().describe("YouTube category ID to filter results"),
      maxResults: z.number().optional().default(25).describe("Number of videos to return (default 25, max 50)")
    }),
    handler: async ({ regionCode, categoryId, maxResults = 25 }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const trendingVideos = await youtubeClient.getTrendingVideos({
          regionCode,
          categoryId,
          maxResults: Math.min(maxResults, 50)
        });
        
        const formattedText = formatTrendingVideos({
          videos: trendingVideos,
          regionCode,
          categoryId
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
];