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

  // Device Type Analytics Tool
  server.tool(
    "get_device_type_analytics",
    "Get device type breakdown (mobile/TV/desktop) for optimizing content format",
    {
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)"),
      videoId: z.string().optional().describe("Optional video ID for video-specific analysis")
    },
    async ({ startDate, endDate, videoId }) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const deviceData = await youtubeClient.getDeviceTypeAnalytics({ startDate, endDate, videoId, metrics: [] });
        
        return {
          content: [{
            type: "text",
            text: `Device Type Analytics (${startDate} to ${endDate})${videoId ? ` for video ${videoId}` : ''}:

Strategic Implications:
• Mobile (>60%) → Vertical-friendly content, clear audio, large text
• TV (>20%) → Cinema quality, longer content works better
• Desktop → Complex tutorials, detailed content ideal

${JSON.stringify(deviceData, null, 2)}`
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

  // Optimal Posting Time Tool
  server.tool(
    "get_optimal_posting_time",
    "Find optimal posting times based on audience activity patterns",
    {
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)")
    },
    async ({ startDate, endDate }) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const timingData = await youtubeClient.getOptimalPostingTime({ startDate, endDate });
        
        // Check if timingData exists and has the expected structure
        if (!timingData) {
          return {
            content: [{
              type: "text",
              text: `Optimal Posting Time Analysis (${startDate} to ${endDate}):

No timing data available for the specified date range. This may be due to:
- Insufficient data in the selected time period
- API limitations
- No videos published during this period

Please try a different date range with more video activity.`
            }]
          };
        }

        // Safely handle bestDays array with null checks
        let bestDaysText = 'No specific day performance data available';
        if (Array.isArray(timingData.bestDays) && timingData.bestDays.length > 0) {
          bestDaysText = timingData.bestDays.slice(0, 5).map((d: any) => {
            const date = d.date || 'Unknown date';
            const views = d.views ? d.views.toLocaleString() : '0';
            const watchTime = d.watchTime ? Math.round(d.watchTime / 60).toLocaleString() : '0';
            return `  ${date} - Views: ${views}, Watch Time: ${watchTime} min`;
          }).join('\n');
        }

        // Safely handle general recommendations
        let recommendationsText = 'No specific recommendations available';
        if (timingData.generalRecommendations?.bestTimes && Array.isArray(timingData.generalRecommendations.bestTimes)) {
          recommendationsText = timingData.generalRecommendations.bestTimes.map((time: string) => `• ${time}`).join('\n');
        }

        // Safely handle day of week insights
        let dayInsightsText = 'No day-of-week patterns available';
        if (timingData.dayOfWeekInsights && typeof timingData.dayOfWeekInsights === 'object') {
          if (timingData.dayOfWeekInsights.message) {
            dayInsightsText = timingData.dayOfWeekInsights.message;
          } else {
            // Format day of week data if available
            const insights = Object.entries(timingData.dayOfWeekInsights)
              .filter(([, data]: [string, any]) => data && typeof data === 'object' && data.avgViews)
              .map(([day, data]: [string, any]) => `  ${day}: ${data.avgViews.toLocaleString()} avg views`)
              .join('\n');
            dayInsightsText = insights || 'Day-of-week data available but not formatted';
          }
        }

        return {
          content: [{
            type: "text",
            text: `Optimal Posting Time Analysis (${startDate} to ${endDate}):

Strategy: Schedule uploads for maximum initial velocity - first 2 hours are crucial for algorithm promotion!

📅 Best Performing Days:
${bestDaysText}

⏰ General Time Recommendations:
${recommendationsText}

📊 Day-of-Week Insights:
${dayInsightsText}

Strategy Note: ${timingData.generalRecommendations?.strategy || 'Upload when your audience is most active'}

Full Analysis:
${JSON.stringify(timingData, null, 2)}`
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