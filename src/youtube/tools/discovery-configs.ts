import { z } from "zod";
import { ToolConfig, ToolContext, Formatters } from '../../types.js';

// Formatters for discovery-related data presentation
const discoveryFormatters: Formatters = {
  optimalPostingTime: (analyticsData: any): string => {
    if (!analyticsData || !analyticsData.rows || analyticsData.rows.length === 0) {
      return "No data available for optimal posting time analysis.";
    }

    // Moved business logic from YouTubeClient.analyzeDayOfWeekPatterns
    const dayOfWeekAnalysis = analyzeDayOfWeekPatterns(analyticsData);
    const bestPerformingDays = identifyBestDays(analyticsData);

    let output = "📅 Optimal Posting Time Analysis:\n\n";
    
    // Best performing days section
    if (bestPerformingDays.length > 0) {
      output += "🎯 Top 5 Best Performing Days:\n";
      bestPerformingDays.slice(0, 5).forEach((day, index) => {
        output += `${index + 1}. ${day.date}: ${day.views.toLocaleString()} views, ${day.watchTime.toLocaleString()} min watch time (Score: ${day.score.toFixed(1)})\n`;
      });
      output += "\n";
    }
    
    // Day of week insights
    if (dayOfWeekAnalysis.message) {
      output += dayOfWeekAnalysis.message + "\n";
    } else if (dayOfWeekAnalysis.length > 0) {
      output += "📊 Day of Week Performance:\n";
      dayOfWeekAnalysis.forEach((day: any) => {
        output += `${day.dayOfWeek}: Avg ${day.avgViews.toLocaleString()} views, ${day.avgWatchTime.toLocaleString()} min watch time (${day.totalDays} days)\n`;
      });
      output += "\n";
    }
    
    // General recommendations
    output += "💡 Strategic Recommendations:\n";
    output += "• Tuesday-Thursday: 2:00 PM - 4:00 PM (highest engagement)\n";
    output += "• Saturday-Sunday: 9:00 AM - 11:00 AM (weekend audience)\n";
    output += "• Avoid Fridays after 3:00 PM and Monday mornings\n";
    output += "• Upload 2 hours before peak audience activity for maximum algorithm boost\n";

    return output;
  },

  trafficSources: (data: any): string => {
    if (!data || !data.rows || data.rows.length === 0) {
      return "No traffic source data available for the specified period.";
    }

    let output = "🚀 Traffic Source Analysis:\n\n";
    
    const headers = data.columnHeaders?.map((h: any) => h.name) || [];
    
    data.rows.forEach((row: any[], index: number) => {
      const source = row[0] || `Source ${index + 1}`;
      const views = Number(row[1] || 0);
      output += `📊 ${source}: ${views.toLocaleString()} views\n`;
    });

    return output;
  },

  searchTerms: (data: any): string => {
    if (!data || !data.rows || data.rows.length === 0) {
      return "No search terms data available for the specified video and period.";
    }

    let output = "🔍 Search Terms Analysis:\n\n";
    
    data.rows.forEach((row: any[], index: number) => {
      const term = row[0] || `Term ${index + 1}`;
      const views = Number(row[1] || 0);
      output += `"${term}": ${views.toLocaleString()} views\n`;
    });

    return output + "\n💡 Use these terms to optimize your titles, descriptions, and tags for better discoverability.";
  }
};

// Helper functions moved from YouTubeClient
function analyzeDayOfWeekPatterns(analyticsData: any): any {
  if (!analyticsData.rows || analyticsData.rows.length === 0) {
    return { message: "No data available for day of week analysis" };
  }

  const dayData: { [dayOfWeek: string]: { views: number; watchTime: number; subscribers: number; count: number } } = {};
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  analyticsData.rows.forEach((row: any[]) => {
    const dateStr = row[0]; // YYYY-MM-DD format
    const views = parseInt(row[1]) || 0;
    const watchTime = parseInt(row[2]) || 0;
    const subscribers = parseInt(row[3]) || 0;

    const date = new Date(dateStr);
    const dayOfWeek = dayNames[date.getDay()];

    if (!dayData[dayOfWeek]) {
      dayData[dayOfWeek] = { views: 0, watchTime: 0, subscribers: 0, count: 0 };
    }

    dayData[dayOfWeek].views += views;
    dayData[dayOfWeek].watchTime += watchTime;
    dayData[dayOfWeek].subscribers += subscribers;
    dayData[dayOfWeek].count += 1;
  });

  return Object.entries(dayData)
    .map(([day, data]) => ({
      dayOfWeek: day,
      avgViews: data.count > 0 ? Math.round(data.views / data.count) : 0,
      avgWatchTime: data.count > 0 ? Math.round(data.watchTime / data.count) : 0,
      avgSubscribers: data.count > 0 ? Math.round(data.subscribers / data.count) : 0,
      totalDays: data.count
    }))
    .sort((a, b) => b.avgViews - a.avgViews);
}

function identifyBestDays(analyticsData: any): Array<{ date: string; views: number; watchTime: number; score: number }> {
  if (!analyticsData.rows || analyticsData.rows.length === 0) {
    return [];
  }

  return analyticsData.rows
    .map((row: any[]) => ({
      date: row[0],
      views: parseInt(row[1]) || 0,
      watchTime: parseInt(row[2]) || 0,
      subscribers: parseInt(row[3]) || 0,
      score: (parseInt(row[1]) || 0) * 0.6 + (parseInt(row[2]) || 0) * 0.3 + (parseInt(row[3]) || 0) * 0.1
    }))
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 10);
}

export const discoveryTools: ToolConfig[] = [
  {
    name: "get_optimal_posting_time",
    description: "Get optimal posting time analysis with day-of-week patterns and strategic insights",
    category: "discovery",
    schema: z.object({
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)")
    }),
    formatters: discoveryFormatters,
    handler: async ({ startDate, endDate }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const analyticsData = await youtubeClient.getOptimalPostingTime({ startDate, endDate });
        const formattedText = discoveryFormatters.optimalPostingTime(analyticsData);
        
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
    formatters: discoveryFormatters,
    handler: async ({ startDate, endDate, videoId }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const traffic = await youtubeClient.getTrafficSources({ startDate, endDate, videoId, metrics: [] });
        const formattedText = discoveryFormatters.trafficSources(traffic);
        
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
    formatters: discoveryFormatters,
    handler: async ({ videoId, startDate, endDate }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const searchTerms = await youtubeClient.getSearchTerms({ videoId, startDate, endDate, metrics: [] });
        const formattedText = discoveryFormatters.searchTerms(searchTerms);
        
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
