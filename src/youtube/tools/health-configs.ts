import { z } from "zod";
import { ToolConfig, ToolContext } from '../../types.js';

export const healthTools: ToolConfig[] = [
  {
    name: "get_channel_overview",
    description: "Get channel vital signs - views, watch time, subscriber changes, and growth patterns",
    category: "health",
    schema: z.object({
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)")
    }),
    handler: async ({ startDate, endDate }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const overview = await youtubeClient.getChannelOverview({ startDate, endDate });
        
        return {
          content: [{
            type: "text",
            text: `Channel Overview (${startDate} to ${endDate}):\n\n${JSON.stringify(overview, null, 2)}`
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
    name: "get_comparison_metrics",
    description: "Compare channel metrics between two time periods to identify growth or decline trends",
    category: "health",
    schema: z.object({
      metrics: z.array(z.string()).describe("Metrics to compare (e.g., views, estimatedMinutesWatched, subscribersGained)"),
      period1Start: z.string().describe("Period 1 start date (YYYY-MM-DD)"),
      period1End: z.string().describe("Period 1 end date (YYYY-MM-DD)"),
      period2Start: z.string().describe("Period 2 start date (YYYY-MM-DD)"),
      period2End: z.string().describe("Period 2 end date (YYYY-MM-DD)")
    }),
    handler: async ({ metrics, period1Start, period1End, period2Start, period2End }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const comparison = await youtubeClient.getComparisonMetrics({
          metrics,
          period1Start,
          period1End,
          period2Start,
          period2End
        });
        
        return {
          content: [{
            type: "text",
            text: `Comparison Metrics:
Period 1 (${period1Start} to ${period1End}) vs Period 2 (${period2Start} to ${period2End})

${JSON.stringify(comparison, null, 2)}`
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
    name: "get_average_view_percentage",
    description: "Get average view percentage (what % of videos viewers actually watch) for a date range",
    category: "health",
    schema: z.object({
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)")
    }),
    handler: async ({ startDate, endDate }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const result = await youtubeClient.getChannelAnalytics({
          startDate,
          endDate,
          metrics: ['averageViewPercentage']
        });
        
        const percentage = result.rows?.[0]?.[0];
        return {
          content: [{
            type: "text",
            text: `Average View Percentage (${startDate} to ${endDate}): ${percentage}%\n\nThis shows what percentage of your videos viewers actually watch on average, accounting for different video lengths.`
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
