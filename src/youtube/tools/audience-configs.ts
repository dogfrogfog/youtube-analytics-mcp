import { z } from "zod";
import { ToolConfig, ToolContext } from '../../types.js';
import { parseAnalyticsResponse, parseDemographics, parseGeographic, parseSubscriberAnalytics } from '../../utils/parsers/analytics.js';
import { formatDemographics, formatGeographicDistribution, formatSubscriberAnalytics } from '../../utils/formatters/audience.js';


export const audienceTools: ToolConfig[] = [
  {
    name: "get_video_demographics",
    description: "Get audience demographics (age/gender breakdown) for channel or specific video",
    category: "audience",
    schema: z.object({
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)"),
      videoId: z.string().optional().describe("Optional video ID for video-specific analysis")
    }),
    handler: async ({ startDate, endDate, videoId }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const rawData = await youtubeClient.getDemographics({ startDate, endDate, videoId, metrics: [] });
        
        // Parse and format the data
        const parsedData = parseAnalyticsResponse(rawData);
        const demographicData = parseDemographics(parsedData);
        const formattedText = formatDemographics(demographicData);
        
        return {
          content: [{
            type: "text",
            text: `Demographics Analysis (${startDate} to ${endDate})${videoId ? ` for video ${videoId}` : ''}:\n\n${formattedText}`
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
    name: "get_geographic_distribution",
    description: "Get viewer geographic distribution by country for audience insights",
    category: "audience",
    schema: z.object({
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)"),
      videoId: z.string().optional().describe("Optional video ID for video-specific analysis")
    }),
    handler: async ({ startDate, endDate, videoId }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const rawData = await youtubeClient.getGeographicDistribution({ startDate, endDate, videoId, metrics: [] });
        
        // Parse and format the data
        const parsedData = parseAnalyticsResponse(rawData);
        const geographicData = parseGeographic(parsedData);
        const formattedText = formatGeographicDistribution(geographicData);
        
        return {
          content: [{
            type: "text",
            text: `Geographic Distribution (${startDate} to ${endDate})${videoId ? ` for video ${videoId}` : ''}:\n\n${formattedText}`
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
    name: "get_subscriber_analytics",
    description: "Get subscriber vs non-subscriber view analytics for growth insights",
    category: "audience",
    schema: z.object({
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)"),
      videoId: z.string().optional().describe("Optional video ID for video-specific analysis")
    }),
    handler: async ({ startDate, endDate, videoId }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const rawData = await youtubeClient.getSubscriberAnalytics({ startDate, endDate, videoId, metrics: [] });
        
        // Parse and format the data
        const parsedData = parseAnalyticsResponse(rawData);
        const subscriberData = parseSubscriberAnalytics(parsedData);
        const formattedText = formatSubscriberAnalytics(subscriberData);
        
        return {
          content: [{
            type: "text",
            text: `Subscriber Analytics (${startDate} to ${endDate})${videoId ? ` for video ${videoId}` : ''}:\n\n${formattedText}`
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
