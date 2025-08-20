import { z } from "zod";
import { ToolConfig, ToolContext } from '../../types.js';
import { parseAnalyticsResponse } from '../../utils/parsers/analytics.js';
import { analyzeAudienceRetention, formatAudienceRetention, findDropOffPoints, formatRetentionDropoffs } from '../../utils/formatters/performance.js';


export const performanceTools: ToolConfig[] = [
  {
    name: "get_audience_retention",
    description: "Track where viewers leave videos - identifies hook problems, pacing issues, and engagement drops",
    category: "performance",
    schema: z.object({
      videoId: z.string().describe("Video ID to analyze"),
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)")
    }),
    handler: async ({ videoId, startDate, endDate }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const rawData = await youtubeClient.getAudienceRetention({ 
          videoId, startDate, endDate, metrics: [] 
        });
        
        // Parse and analyze the data
        const parsedData = parseAnalyticsResponse(rawData);
        const analysis = analyzeAudienceRetention(parsedData);
        const formattedText = formatAudienceRetention(analysis);
        
        return {
          content: [{
            type: "text",
            text: `Audience Retention for video ${videoId} (${startDate} to ${endDate}):

${formattedText}`
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
    name: "get_retention_dropoff_points",
    description: "Find exact moments losing viewers with severity levels - surgical precision for content improvement",
    category: "performance",
    schema: z.object({
      videoId: z.string().describe("Video ID to analyze"),
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)"),
      threshold: z.number().optional().default(0.1).describe("Drop threshold (default 0.1 = 10%)")
    }),
    handler: async ({ videoId, startDate, endDate, threshold }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const rawData = await youtubeClient.getAudienceRetention({ 
          videoId, startDate, endDate, metrics: [] 
        });
        
        // Parse and analyze the data
        const parsedData = parseAnalyticsResponse(rawData);
        const dropOffPoints = findDropOffPoints(parsedData, threshold);
        const formattedText = formatRetentionDropoffs(dropOffPoints);
        
        return {
          content: [{
            type: "text",
            text: `Retention Drop-off Points for video ${videoId}:

${formattedText}`
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
