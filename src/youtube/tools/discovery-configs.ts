import { z } from "zod";
import { ToolConfig, ToolContext } from '../../types.js';
import { parseAnalyticsResponse, parseTrafficSources, parseSearchTerms } from '../../utils/parsers/analytics.js';
import { analyzeOptimalPostingTime, formatOptimalPostingTime, formatTrafficSources, formatSearchTerms } from '../../utils/formatters/discovery.js';


export const discoveryTools: ToolConfig[] = [
  {
    name: "get_optimal_posting_time",
    description: "Get optimal posting time analysis with day-of-week patterns and strategic insights",
    category: "discovery",
    schema: z.object({
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)")
    }),
    handler: async ({ startDate, endDate }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const rawData = await youtubeClient.getOptimalPostingTime({ startDate, endDate });
        
        // Parse and analyze the data
        const parsedData = parseAnalyticsResponse(rawData);
        const analysis = analyzeOptimalPostingTime(parsedData);
        const formattedText = formatOptimalPostingTime(analysis);
        
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
  {
    name: "get_traffic_sources",
    description: "Get traffic source analysis showing where viewers discover your content",
    category: "discovery",
    schema: z.object({
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)"),
      videoId: z.string().optional().describe("Optional video ID for video-specific analysis")
    }),
    handler: async ({ startDate, endDate, videoId }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const rawData = await youtubeClient.getTrafficSources({ startDate, endDate, videoId, metrics: [] });
        
        // Parse and format the data
        const parsedData = parseAnalyticsResponse(rawData);
        const trafficData = parseTrafficSources(parsedData);
        const formattedText = formatTrafficSources(trafficData);
        
        return {
          content: [{
            type: "text",
            text: `Traffic Sources (${startDate} to ${endDate})${videoId ? ` for video ${videoId}` : ''}:\n\n${formattedText}`
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
    name: "get_search_terms",
    description: "Get search terms that led viewers to a specific video for SEO insights",
    category: "discovery",
    schema: z.object({
      videoId: z.string().describe("Video ID to analyze search terms for"),
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)")
    }),
    handler: async ({ videoId, startDate, endDate }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const rawData = await youtubeClient.getSearchTerms({ videoId, startDate, endDate, metrics: [] });
        
        // Parse and format the data
        const parsedData = parseAnalyticsResponse(rawData);
        const searchData = parseSearchTerms(parsedData);
        const formattedText = formatSearchTerms(searchData);
        
        return {
          content: [{
            type: "text",
            text: `Search Terms for video ${videoId} (${startDate} to ${endDate}):\n\n${formattedText}`
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
