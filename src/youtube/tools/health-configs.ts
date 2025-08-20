import { z } from "zod";
import { ToolConfig, ToolContext, Formatters, safeFormatter } from '../../types.js';

// Formatters for health-related data presentation
const healthFormattersRaw = {
  channelOverview: (data: any): string => {
    if (!data || !data.rows || data.rows.length === 0) {
      return "No channel overview data available for the specified date range.";
    }

    // Format channel overview with clear sections
    let output = "Channel Health Overview:\n\n";
    
    // Process metrics based on what's in the data
    const metrics = data.columnHeaders?.map((header: any) => header.name) || [];
    const totalRow = data.rows[0] || [];
    
    // Format key metrics with proper labels
    metrics.forEach((metric: string, index: number) => {
      const value = totalRow[index] || 0;
      let formattedValue = value;
      let label = metric;
      
      switch (metric) {
        case 'views':
          label = 'Total Views';
          formattedValue = Number(value).toLocaleString();
          break;
        case 'estimatedMinutesWatched':
          label = 'Watch Time (minutes)';
          formattedValue = Number(value).toLocaleString();
          break;
        case 'subscribersGained':
          label = 'Subscribers Gained';
          formattedValue = Number(value).toLocaleString();
          break;
        case 'averageViewDuration':
          label = 'Average View Duration (seconds)';
          formattedValue = Number(value).toFixed(1);
          break;
      }
      
      output += `📊 ${label}: ${formattedValue}\n`;
    });

    return output + "\nNote: This represents aggregate performance for the selected time period.";
  },

  comparisonMetrics: (data: any): string => {
    if (!data || !data.period1 || !data.period2) {
      return "Comparison data is incomplete. Both time periods are required.";
    }

    let output = "📈 Period-to-Period Comparison:\n\n";
    
    const period1 = data.period1;
    const period2 = data.period2;
    
    // Compare each metric
    const metrics = period1.columnHeaders?.map((header: any) => header.name) || [];
    
    metrics.forEach((metric: string, index: number) => {
      const value1 = Number(period1.rows?.[0]?.[index] || 0);
      const value2 = Number(period2.rows?.[0]?.[index] || 0);
      
      const change = value2 - value1;
      const percentChange = value1 > 0 ? ((change / value1) * 100) : 0;
      const direction = change > 0 ? "📈" : change < 0 ? "📉" : "➡️";
      
      let label = metric;
      switch (metric) {
        case 'views':
          label = 'Views';
          break;
        case 'estimatedMinutesWatched':
          label = 'Watch Time';
          break;
        case 'subscribersGained':
          label = 'Subscribers';
          break;
      }
      
      output += `${direction} ${label}: ${value1.toLocaleString()} → ${value2.toLocaleString()} `;
      output += `(${change >= 0 ? '+' : ''}${change.toLocaleString()}, ${percentChange.toFixed(1)}%)\n`;
    });

    return output;
  }
};

// Wrap formatters with error handling
const healthFormatters: Formatters = {
  channelOverview: safeFormatter('channelOverview', healthFormattersRaw.channelOverview),
  comparisonMetrics: safeFormatter('comparisonMetrics', healthFormattersRaw.comparisonMetrics)
};

export const healthTools: ToolConfig[] = [
  {
    name: "get_channel_overview",
    description: "Get channel vital signs - views, watch time, subscriber changes, and growth patterns",
    category: "health",
    schema: z.object({
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)")
    }),
    formatters: healthFormatters,
    handler: async ({ startDate, endDate }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const overview = await youtubeClient.getChannelOverview({ startDate, endDate });
        const formattedText = healthFormatters.channelOverview(overview);
        
        return {
          content: [{
            type: "text",
            text: `Channel Overview (${startDate} to ${endDate}):\n\n${formattedText}`
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
    formatters: healthFormatters,
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
        const formattedText = healthFormatters.comparisonMetrics(comparison);
        
        return {
          content: [{
            type: "text",
            text: `Comparison Metrics:
Period 1 (${period1Start} to ${period1End}) vs Period 2 (${period2Start} to ${period2End})

${formattedText}`
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
