import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { YouTubeClient } from '../youtube-client.js';

export function registerPerformanceTools(server: McpServer, getYouTubeClient: () => Promise<YouTubeClient>) {
  // Audience Retention Tool
  server.tool(
    "get_audience_retention",
    "Track where viewers leave videos - identifies hook problems, pacing issues, and engagement drops",
    {
      videoId: z.string().describe("Video ID to analyze"),
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)")
    },
    async ({ videoId, startDate, endDate }) => {
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
    }
  );

  // Retention Drop-off Points Tool
  server.tool(
    "get_retention_dropoff_points",
    "Find exact moments losing viewers with severity levels - surgical precision for content improvement",
    {
      videoId: z.string().describe("Video ID to analyze"),
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)"),
      threshold: z.number().optional().default(0.1).describe("Drop threshold (default 0.1 = 10%)")
    },
    async ({ videoId, startDate, endDate, threshold }) => {
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
    }
  );

  // Watch Time Metrics Tool
  server.tool(
    "get_watch_time_metrics",
    "YouTube's #1 ranking factor - get watch time, average duration, and view percentage",
    {
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)"),
      videoId: z.string().optional().describe("Optional video ID for specific analysis")
    },
    async ({ startDate, endDate, videoId }) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const metrics = await youtubeClient.getWatchTimeMetrics({ 
          startDate, endDate, videoId, metrics: [] 
        });
        
        return {
          content: [{
            type: "text",
            text: `Watch Time Metrics (${startDate} to ${endDate})${videoId ? ` for video ${videoId}` : ''}:

Performance Benchmarks:
- Average view duration >50% = Excellent
- 30-50% = Good
- <30% = Needs improvement

${JSON.stringify(metrics, null, 2)}`
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

  // Content Performance by Length Tool
  server.tool(
    "get_content_performance_by_length",
    "Find your optimal video length sweet spot by analyzing performance across duration buckets",
    {
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)")
    },
    async ({ startDate, endDate }) => {
      try {
        const youtubeClient = await getYouTubeClient();
        
        // Get channel videos from the period
        const videos = await youtubeClient.searchChannelVideos({ 
          startDate, endDate, maxResults: 50 
        });
        
        // Get analytics for all videos in the channel during this period
        const channelMetrics = await youtubeClient.getWatchTimeMetrics({ 
          startDate, endDate, metrics: [] 
        });
        
        // Analyze performance by general content strategy
        const performanceAnalysis = {
          totalVideos: videos.length,
          averagePerformance: channelMetrics,
          insights: [
            "Short videos (0-5 min): Best for quick tips, tutorials, news updates",
            "Medium videos (5-15 min): Ideal for tutorials, reviews, vlogs",
            "Long videos (15-30 min): Great for in-depth analysis, documentaries",
            "Very long videos (30+ min): Best for comprehensive guides, podcasts"
          ],
          recommendations: [
            "Test different lengths with similar content to find your sweet spot",
            "Monitor audience retention across different durations",
            "Consider your audience's viewing habits and platform (mobile vs desktop)"
          ]
        };
        
        return {
          content: [{
            type: "text",
            text: `Content Performance by Length Analysis (${startDate} to ${endDate}):

Video Count: ${videos.length}

Performance Insights:
${performanceAnalysis.insights.map(insight => `• ${insight}`).join('\n')}

Strategic Recommendations:
${performanceAnalysis.recommendations.map(rec => `• ${rec}`).join('\n')}

Channel Analytics for Period:
${JSON.stringify(channelMetrics, null, 2)}

Note: For precise length analysis, individual video duration data would need to be fetched from YouTube Data API and cross-referenced with performance metrics.`
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

  // Playlist Performance Tool
  server.tool(
    "get_playlist_performance",
    "Measure binge potential - track playlist starts, views per start, and average time in playlist",
    {
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)"),
      playlistId: z.string().optional().describe("Optional playlist ID for specific analysis")
    },
    async ({ startDate, endDate, playlistId }) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const performance = await youtubeClient.getPlaylistPerformance({ 
          startDate, endDate, playlistId, metrics: [] 
        });
        
        return {
          content: [{
            type: "text",
            text: `Playlist Performance (${startDate} to ${endDate})${playlistId ? ` for playlist ${playlistId}` : ''}:

Success Metrics:
- Views per playlist start >3 = Good series
- Average time in playlist >15 min = Strong series

${JSON.stringify(performance, null, 2)}`
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

  // Viewer Session Time Tool
  server.tool(
    "get_viewer_session_time",
    "Total time viewers spend on YouTube after your video - critical for algorithm favorability",
    {
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)")
    },
    async ({ startDate, endDate }) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const sessionTime = await youtubeClient.getViewerSessionTime({ 
          startDate, endDate, metrics: [] 
        });
        
        return {
          content: [{
            type: "text",
            text: `Viewer Session Time (${startDate} to ${endDate}):

Why Critical: YouTube rewards videos that keep people on platform longer

${JSON.stringify(sessionTime, null, 2)}`
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