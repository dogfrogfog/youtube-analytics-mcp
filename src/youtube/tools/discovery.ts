import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { YouTubeClient } from '../youtube-client.js';

export function registerDiscoveryTools(server: McpServer, getYouTubeClient: () => Promise<YouTubeClient>) {
  // Traffic Sources Tool
  server.tool(
    "get_traffic_sources",
    "Get traffic source analysis showing where viewers discover your content",
    {
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)"),
      videoId: z.string().optional().describe("Optional video ID for video-specific analysis")
    },
    async ({ startDate, endDate, videoId }) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const traffic = await youtubeClient.getTrafficSources({ startDate, endDate, videoId, metrics: [] });
        
        return {
          content: [{
            type: "text",
            text: `Traffic Sources (${startDate} to ${endDate})${videoId ? ` for video ${videoId}` : ''}:\n\n${JSON.stringify(traffic, null, 2)}`
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

  // Search Terms Tool
  server.tool(
    "get_search_terms",
    "Get search terms that led viewers to a specific video for SEO insights",
    {
      videoId: z.string().describe("Video ID to analyze search terms for"),
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)")
    },
    async ({ videoId, startDate, endDate }) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const searchTerms = await youtubeClient.getSearchTerms({ videoId, startDate, endDate, metrics: [] });
        
        return {
          content: [{
            type: "text",
            text: `Search Terms for video ${videoId} (${startDate} to ${endDate}):\n\n${JSON.stringify(searchTerms, null, 2)}`
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