import { z } from "zod";
import { ToolConfig, ToolContext, Formatters } from '../../types.js';

// Formatters for engagement-related data presentation
const engagementFormatters: Formatters = {
  engagementMetrics: (data: any, dateInfo?: { startDate: string; endDate: string; videoId?: string }): string => {
    if (!data) {
      return "No engagement data available for the specified period.";
    }

    // Calculate engagement metrics from the raw data
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let subscribersGained = 0;
    let subscribersLost = 0;
    
    if (data.rows && data.rows.length > 0) {
      data.rows.forEach((row: any[]) => {
        // Columns based on typical metrics order
        totalLikes += parseInt(row[1]) || 0;
        totalComments += parseInt(row[3]) || 0;
        totalShares += parseInt(row[4]) || 0;
        subscribersGained += parseInt(row[5]) || 0;
        subscribersLost += parseInt(row[6]) || 0;
        totalViews += parseInt(row[7]) || 0;
      });
    }
    
    // Calculate engagement rates
    const likeRate = totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(2) : '0.00';
    const commentRate = totalViews > 0 ? ((totalComments / totalViews) * 100).toFixed(2) : '0.00';
    const shareRate = totalViews > 0 ? ((totalShares / totalViews) * 100).toFixed(2) : '0.00';
    const netSubscriberChange = subscribersGained - subscribersLost;
    
    let output = `💫 Engagement Analysis`;
    if (dateInfo) {
      output += ` (${dateInfo.startDate} to ${dateInfo.endDate})`;
      if (dateInfo.videoId) output += ` for video ${dateInfo.videoId}`;
    }
    output += ":\n\n";
    
    // Engagement Summary
    output += "📊 ENGAGEMENT SUMMARY:\n";
    output += `• Total Views: ${totalViews.toLocaleString()}\n`;
    output += `• Total Likes: ${totalLikes.toLocaleString()} (${likeRate}% rate)\n`;
    output += `• Total Comments: ${totalComments.toLocaleString()} (${commentRate}% rate)\n`;
    output += `• Total Shares: ${totalShares.toLocaleString()} (${shareRate}% rate)\n`;
    output += `• Net Subscriber Change: ${netSubscriberChange > 0 ? '+' : ''}${netSubscriberChange.toLocaleString()}\n\n`;
    
    // Performance Benchmarks
    output += "🎯 PERFORMANCE BENCHMARKS:\n";
    output += "• Like Rate: >4% Excellent | 2-4% Good | <2% Needs Work\n";
    output += "• Comment Rate: >1% High | 0.5-1% Moderate | <0.5% Low\n";
    output += "• Share Rate: >0.5% Viral | 0.1-0.5% Good | <0.1% Low\n\n";
    
    // Performance Insights
    const insights = [];
    const likeRateNum = parseFloat(likeRate);
    const commentRateNum = parseFloat(commentRate);
    const shareRateNum = parseFloat(shareRate);
    
    if (likeRateNum > 4) {
      insights.push("🎯 Excellent like rate - content resonates strongly with audience");
    } else if (likeRateNum > 2) {
      insights.push("✅ Good like rate - content is well-received");
    } else {
      insights.push("⚠️ Low like rate - consider improving content quality or thumbnails");
    }
    
    if (commentRateNum > 1) {
      insights.push("💬 High comment rate - content sparks discussion");
    } else if (commentRateNum > 0.5) {
      insights.push("💬 Moderate comment rate - some audience engagement");
    } else {
      insights.push("💬 Low comment rate - consider call-to-actions or controversial topics");
    }
    
    if (shareRateNum > 0.5) {
      insights.push("🚀 High share rate - viral potential content");
    } else if (shareRateNum > 0.1) {
      insights.push("📤 Moderate share rate - decent viral potential");
    } else {
      insights.push("📤 Low share rate - content needs more shareability");
    }
    
    if (netSubscriberChange > 0) {
      insights.push(`📈 Positive subscriber growth: +${netSubscriberChange.toLocaleString()}`);
    } else if (netSubscriberChange < 0) {
      insights.push(`📉 Subscriber loss: ${netSubscriberChange.toLocaleString()}`);
    }
    
    output += "💡 INSIGHTS:\n";
    insights.forEach(insight => {
      output += `${insight}\n`;
    });
    
    // Improvement Strategies
    output += "\n📈 IMPROVEMENT STRATEGIES:\n";
    output += "• Increase likes: Better thumbnails, stronger hooks, quality content\n";
    output += "• Boost comments: Ask questions, controversial takes, community posts\n";
    output += "• Drive shares: Emotional content, trending topics, surprising facts\n";
    output += "• Grow subscribers: Consistent uploads, clear value proposition, CTAs\n";
    
    return output;
  }
};

export const engagementTools: ToolConfig[] = [
  {
    name: "get_engagement_metrics",
    description: "Get engagement metrics (likes/comments/shares analysis) to measure viewer emotional investment and content interaction quality",
    category: "engagement",
    schema: z.object({
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)"),
      videoId: z.string().optional().describe("Optional video ID for specific analysis")
    }),
    formatters: engagementFormatters,
    handler: async ({ startDate, endDate, videoId }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const engagement = await youtubeClient.getEngagementMetrics({ 
          startDate, endDate, videoId 
        });
        
        // Use the formatter to process the data
        const formattedText = (engagementFormatters.engagementMetrics as any)(
          engagement, 
          { startDate, endDate, videoId }
        );
        
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
];
