import { z } from "zod";
import { ToolConfig, ToolContext } from '../../types.js';

export const engagementToolConfigs: ToolConfig[] = [
  {
    name: "get_engagement_metrics",
    description: "Get engagement metrics (likes/comments/shares analysis) to measure viewer emotional investment and content interaction quality",
    category: "engagement",
    schema: z.object({
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)"),
      videoId: z.string().optional().describe("Optional video ID for specific analysis")
    }),
    handler: async ({ startDate, endDate, videoId }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const engagement = await youtubeClient.getEngagementMetrics({ 
          startDate, endDate, videoId 
        });
        
        // Calculate engagement metrics from the data
        let totalViews = 0;
        let totalLikes = 0;
        let totalComments = 0;
        let totalShares = 0;
        let subscribersGained = 0;
        let subscribersLost = 0;
        
        if (engagement.rows && engagement.rows.length > 0) {
          engagement.rows.forEach((row: any[]) => {
            // Columns based on metrics: likes, dislikes, comments, shares, subscribersGained, subscribersLost, views
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
        
        // Performance insights
        const insights = [];
        if (parseFloat(likeRate) > 4) {
          insights.push("🎯 Excellent like rate - content resonates strongly with audience");
        } else if (parseFloat(likeRate) > 2) {
          insights.push("✅ Good like rate - content is well-received");
        } else {
          insights.push("⚠️ Low like rate - consider improving content quality or thumbnails");
        }
        
        if (parseFloat(commentRate) > 1) {
          insights.push("💬 High comment rate - content sparks discussion");
        } else if (parseFloat(commentRate) > 0.5) {
          insights.push("💬 Moderate comment rate - some audience engagement");
        } else {
          insights.push("💬 Low comment rate - consider call-to-actions or controversial topics");
        }
        
        if (parseFloat(shareRate) > 0.5) {
          insights.push("🚀 High share rate - viral potential content");
        } else if (parseFloat(shareRate) > 0.1) {
          insights.push("📤 Moderate share rate - decent viral potential");
        } else {
          insights.push("📤 Low share rate - content needs more shareability");
        }
        
        return {
          content: [{
            type: "text",
            text: `Engagement Metrics Analysis (${startDate} to ${endDate})${videoId ? ` for video ${videoId}` : ''}:

📊 ENGAGEMENT SUMMARY:
• Total Views: ${totalViews.toLocaleString()}
• Total Likes: ${totalLikes.toLocaleString()} (${likeRate}% rate)
• Total Comments: ${totalComments.toLocaleString()} (${commentRate}% rate)
• Total Shares: ${totalShares.toLocaleString()} (${shareRate}% rate)
• Net Subscriber Change: ${netSubscriberChange > 0 ? '+' : ''}${netSubscriberChange.toLocaleString()}

🎯 PERFORMANCE BENCHMARKS:
• Like Rate: >4% Excellent | 2-4% Good | <2% Needs Work
• Comment Rate: >1% High | 0.5-1% Moderate | <0.5% Low
• Share Rate: >0.5% Viral | 0.1-0.5% Good | <0.1% Low

💡 INSIGHTS:
${insights.map(insight => `${insight}`).join('\n')}

📈 IMPROVEMENT STRATEGIES:
• Increase likes: Better thumbnails, stronger hooks, quality content
• Boost comments: Ask questions, controversial takes, community posts
• Drive shares: Emotional content, trending topics, surprising facts
• Grow subscribers: Consistent uploads, clear value proposition, CTAs

Raw Data:
${JSON.stringify(engagement, null, 2)}`
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