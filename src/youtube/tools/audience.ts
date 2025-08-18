import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { YouTubeClient } from '../youtube-client.js';

export function registerAudienceTools(server: McpServer, getYouTubeClient: () => Promise<YouTubeClient>) {
  // Video Demographics Tool
  server.tool(
    "get_video_demographics",
    "Get audience demographics (age/gender breakdown) for channel or specific video",
    {
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)"),
      videoId: z.string().optional().describe("Optional video ID for video-specific analysis")
    },
    async ({ startDate, endDate, videoId }) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const demographics = await youtubeClient.getDemographics({ startDate, endDate, videoId, metrics: [] });
        
        return {
          content: [{
            type: "text",
            text: `Demographics Analysis (${startDate} to ${endDate})${videoId ? ` for video ${videoId}` : ''}:\n\n${JSON.stringify(demographics, null, 2)}`
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

  // Geographic Distribution Tool
  server.tool(
    "get_geographic_distribution",
    "Get viewer geographic distribution by country for audience insights",
    {
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)"),
      videoId: z.string().optional().describe("Optional video ID for video-specific analysis")
    },
    async ({ startDate, endDate, videoId }) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const geographic = await youtubeClient.getGeographicDistribution({ startDate, endDate, videoId, metrics: [] });
        
        return {
          content: [{
            type: "text",
            text: `Geographic Distribution (${startDate} to ${endDate})${videoId ? ` for video ${videoId}` : ''}:\n\n${JSON.stringify(geographic, null, 2)}`
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

  // Subscriber Analytics Tool
  server.tool(
    "get_subscriber_analytics",
    "Get subscriber vs non-subscriber view analytics for growth insights",
    {
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)"),
      videoId: z.string().optional().describe("Optional video ID for video-specific analysis")
    },
    async ({ startDate, endDate, videoId }) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const subscriber = await youtubeClient.getSubscriberAnalytics({ startDate, endDate, videoId, metrics: [] });
        
        return {
          content: [{
            type: "text",
            text: `Subscriber Analytics (${startDate} to ${endDate})${videoId ? ` for video ${videoId}` : ''}:\n\n${JSON.stringify(subscriber, null, 2)}`
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