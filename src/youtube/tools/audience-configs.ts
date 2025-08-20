import { z } from "zod";
import { ToolConfig, ToolContext, Formatters, safeFormatter } from '../../types.js';

// Formatters for audience-related data presentation
const audienceFormattersRaw = {
  demographics: (data: any): string => {
    if (!data || !data.rows || data.rows.length === 0) {
      return "No demographic data available for the specified period.";
    }

    let output = "👥 Audience Demographics:\n\n";
    
    const headers = data.columnHeaders?.map((h: any) => h.name) || [];
    
    // Group data by demographic type
    const ageGenderData: any = {};
    
    data.rows.forEach((row: any[]) => {
      const demographic = row[0]; // e.g., "age25-34.female"
      const views = Number(row[1] || 0);
      
      if (demographic && demographic.includes('.')) {
        const [age, gender] = demographic.split('.');
        if (!ageGenderData[age]) ageGenderData[age] = {};
        ageGenderData[age][gender] = views;
      }
    });
    
    if (Object.keys(ageGenderData).length > 0) {
      output += "📊 Age & Gender Breakdown:\n";
      Object.entries(ageGenderData).forEach(([age, genderData]: [string, any]) => {
        output += `\n${age.replace('age', 'Ages ').replace('-', '-')}:\n`;
        Object.entries(genderData).forEach(([gender, views]: [string, any]) => {
          const percentage = data.totalViews ? ((views / data.totalViews) * 100).toFixed(1) : '0';
          output += `  👤 ${gender.charAt(0).toUpperCase() + gender.slice(1)}: ${views.toLocaleString()} views (${percentage}%)\n`;
        });
      });
    } else {
      // Fallback to simple row display
      data.rows.forEach((row: any[], index: number) => {
        output += `${row[0]}: ${Number(row[1] || 0).toLocaleString()} views\n`;
      });
    }

    return output + "\n💡 Use this data to tailor your content to your primary audience segments.";
  },

  geographic: (data: any): string => {
    if (!data || !data.rows || data.rows.length === 0) {
      return "No geographic data available for the specified period.";
    }

    let output = "🌍 Geographic Distribution:\n\n";
    
    // Sort by views descending
    const sortedRows = data.rows.sort((a: any[], b: any[]) => (Number(b[1]) || 0) - (Number(a[1]) || 0));
    
    let totalViews = 0;
    sortedRows.forEach((row: any[]) => totalViews += Number(row[1] || 0));
    
    output += `Total Views Analyzed: ${totalViews.toLocaleString()}\n\n`;
    output += "📊 Top Countries:\n";
    
    sortedRows.slice(0, 10).forEach((row: any[], index: number) => {
      const country = row[0] || `Country ${index + 1}`;
      const views = Number(row[1] || 0);
      const percentage = totalViews > 0 ? ((views / totalViews) * 100).toFixed(1) : '0';
      
      output += `${index + 1}. 🏴 ${country}: ${views.toLocaleString()} views (${percentage}%)\n`;
    });

    if (sortedRows.length > 10) {
      const remainingViews = sortedRows.slice(10).reduce((sum: number, row: any[]) => sum + (Number(row[1]) || 0), 0);
      const remainingPercentage = totalViews > 0 ? ((remainingViews / totalViews) * 100).toFixed(1) : '0';
      output += `... and ${sortedRows.length - 10} other countries (${remainingViews.toLocaleString()} views, ${remainingPercentage}%)\n`;
    }

    return output + "\n💡 Consider creating content in languages spoken by your top geographic markets.";
  },

  subscriberAnalytics: (data: any): string => {
    if (!data || !data.rows || data.rows.length === 0) {
      return "No subscriber analytics data available for the specified period.";
    }

    let output = "📈 Subscriber vs Non-Subscriber Analytics:\n\n";
    
    let subscriberViews = 0;
    let nonSubscriberViews = 0;
    
    data.rows.forEach((row: any[]) => {
      const subscriberStatus = row[0];
      const views = Number(row[1] || 0);
      
      if (subscriberStatus && subscriberStatus.toLowerCase().includes('subscribed')) {
        subscriberViews += views;
      } else {
        nonSubscriberViews += views;
      }
    });
    
    const totalViews = subscriberViews + nonSubscriberViews;
    
    if (totalViews > 0) {
      const subscriberPercentage = ((subscriberViews / totalViews) * 100).toFixed(1);
      const nonSubscriberPercentage = ((nonSubscriberViews / totalViews) * 100).toFixed(1);
      
      output += `📊 View Distribution:\n`;
      output += `👥 Subscriber Views: ${subscriberViews.toLocaleString()} (${subscriberPercentage}%)\n`;
      output += `🆕 Non-Subscriber Views: ${nonSubscriberViews.toLocaleString()} (${nonSubscriberPercentage}%)\n\n`;
      
      // Growth insights
      if (parseFloat(nonSubscriberPercentage) > 50) {
        output += "🚀 Growth Opportunity: Most views come from non-subscribers - focus on converting them!\n";
        output += "💡 Strategy: Add clear subscribe calls-to-action and create compelling end screens.\n";
      } else {
        output += "🎯 Loyal Audience: Strong subscriber engagement indicates good content-audience fit.\n";
        output += "💡 Strategy: Continue serving your subscriber base while attracting new viewers.\n";
      }
    }

    return output;
  }
};

// Wrap formatters with error handling
const audienceFormatters: Formatters = {
  demographics: safeFormatter('demographics', audienceFormattersRaw.demographics),
  geographic: safeFormatter('geographic', audienceFormattersRaw.geographic),
  subscriberAnalytics: safeFormatter('subscriberAnalytics', audienceFormattersRaw.subscriberAnalytics)
};

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
    formatters: audienceFormatters,
    handler: async ({ startDate, endDate, videoId }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const demographics = await youtubeClient.getDemographics({ startDate, endDate, videoId, metrics: [] });
        const formattedText = audienceFormatters.demographics(demographics);
        
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
    formatters: audienceFormatters,
    handler: async ({ startDate, endDate, videoId }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const geographic = await youtubeClient.getGeographicDistribution({ startDate, endDate, videoId, metrics: [] });
        const formattedText = audienceFormatters.geographic(geographic);
        
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
    formatters: audienceFormatters,
    handler: async ({ startDate, endDate, videoId }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const subscriber = await youtubeClient.getSubscriberAnalytics({ startDate, endDate, videoId, metrics: [] });
        const formattedText = audienceFormatters.subscriberAnalytics(subscriber);
        
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
