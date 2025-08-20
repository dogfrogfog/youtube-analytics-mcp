import { z } from "zod";
import { ToolConfig, ToolContext } from '../../types.js';
import { parseAnalyticsResponse, parseEngagementMetrics } from '../../utils/parsers/analytics.js';
import { analyzeEngagement, formatEngagementMetrics } from '../../utils/formatters/engagement.js';


export const engagementTools: ToolConfig[] = [
  {
    name: "get_engagement_metrics",
    description: "Get engagement metrics (likes/comments/shares analysis) to measure viewer emotional investment and content interaction quality",
    category: "engagement",
    schema: z.object({
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)"),
      videoId: z.string().optional().describe("Optional video ID for specific analysis")
    }),
    handler: async ({ startDate, endDate, videoId }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const rawData = await youtubeClient.getEngagementMetrics({ 
          startDate, endDate, videoId 
        });
        
        // Parse the raw data
        const parsedData = parseAnalyticsResponse(rawData);
        const metrics = parseEngagementMetrics(parsedData);
        
        // Analyze and format the data
        const analysis = analyzeEngagement(metrics);
        const formattedText = formatEngagementMetrics(analysis, { startDate, endDate, videoId });
        
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
