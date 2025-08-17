import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { YouTubeClient } from '../youtube-client.js';

export function registerHealthTools(server: McpServer, getYouTubeClient: () => Promise<YouTubeClient>) {
  // Get channel overview with vital signs
  server.tool(
    "get_channel_overview",
    "Get channel vital signs - views, watch time, subscriber changes, and growth patterns",
    {
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)")
    },
    async ({ startDate, endDate }) => {
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
    }
  );

  // Compare metrics between two time periods
  server.tool(
    "get_comparison_metrics",
    "Compare channel metrics between two time periods to identify growth or decline trends",
    {
      metrics: z.array(z.string()).describe("Metrics to compare (e.g., views, estimatedMinutesWatched, subscribersGained)"),
      period1Start: z.string().describe("Period 1 start date (YYYY-MM-DD)"),
      period1End: z.string().describe("Period 1 end date (YYYY-MM-DD)"),
      period2Start: z.string().describe("Period 2 start date (YYYY-MM-DD)"),
      period2End: z.string().describe("Period 2 end date (YYYY-MM-DD)")
    },
    async ({ metrics, period1Start, period1End, period2Start, period2End }) => {
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
    }
  );
}