import { z } from "zod";
import { ToolConfig, ToolContext } from '../../types.js';

export const performanceToolConfigs: ToolConfig[] = [
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
        const retention = await youtubeClient.getAudienceRetention({ 
          videoId, startDate, endDate, metrics: [] 
        });
        
        return {
          content: [{
            type: "text",
            text: `Audience Retention for video ${videoId} (${startDate} to ${endDate}):

Key Insights:
- 0-15 seconds drop: Hook problem
- 30-60 seconds drop: Expectation mismatch
- Mid-video drops: Pacing issues
- Target: 50%+ average retention

${JSON.stringify(retention, null, 2)}`
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
        const retention = await youtubeClient.getAudienceRetention({ 
          videoId, startDate, endDate, metrics: [] 
        });
        
        // Process retention data to find drop-off points
        const dropOffPoints = [];
        if (retention.rows && retention.rows.length > 1) {
          for (let i = 1; i < retention.rows.length; i++) {
            const drop = retention.rows[i-1][1] - retention.rows[i][1];
            if (drop > threshold) {
              dropOffPoints.push({
                timePercent: retention.rows[i][0] * 100,
                dropAmount: drop * 100,
                severity: drop > 0.2 ? 'critical' : 'warning'
              });
            }
          }
        }
        
        return {
          content: [{
            type: "text",
            text: `Retention Drop-off Points for video ${videoId}:

Success Metric: <10% drops at any single point

${JSON.stringify(dropOffPoints, null, 2)}`
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