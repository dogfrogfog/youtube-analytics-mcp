import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { YouTubeClient } from '../youtube-client.js';

export function registerEngagementTools(server: McpServer, getYouTubeClient: () => Promise<YouTubeClient>) {
  // Engagement Metrics Tool
  server.tool(
    "get_engagement_metrics",
    "Get engagement metrics (likes/comments/shares analysis) to measure viewer emotional investment and content interaction quality",
    {
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)"),
      videoId: z.string().optional().describe("Optional video ID for specific analysis")
    },
    async ({ startDate, endDate, videoId }) => {
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
    }
  );

  // Sharing Analytics Tool
  server.tool(
    "get_sharing_analytics",
    "Get sharing service breakdown to analyze viral potential across different platforms and identify best distribution channels",
    {
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)"),
      videoId: z.string().optional().describe("Optional video ID for specific analysis")
    },
    async ({ startDate, endDate, videoId }) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const sharing = await youtubeClient.getSharingAnalytics({ 
          startDate, endDate, videoId 
        });
        
        // Process sharing data by service
        const sharingByService: { [service: string]: number } = {};
        let totalShares = 0;
        
        if (sharing.rows && sharing.rows.length > 0) {
          sharing.rows.forEach((row: any[]) => {
            const service = row[0] || 'Unknown';
            const shares = parseInt(row[1]) || 0;
            sharingByService[service] = shares;
            totalShares += shares;
          });
        }
        
        // Sort services by share count
        const sortedServices = Object.entries(sharingByService)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10); // Top 10 services
        
        // Generate insights
        const insights = [];
        if (totalShares > 100) {
          insights.push("🚀 High viral potential - content is being shared actively");
        } else if (totalShares > 20) {
          insights.push("📈 Moderate sharing activity - good content reach");
        } else {
          insights.push("📤 Low sharing activity - content needs more shareability");
        }
        
        if (sortedServices.length > 0) {
          const topService = sortedServices[0];
          insights.push(`🥇 Top sharing platform: ${topService[0]} (${topService[1]} shares)`);
        }
        
        // Platform-specific strategies
        const strategies = [
          "📱 Twitter: Create quotable moments, thread-worthy insights",
          "📘 Facebook: Emotional hooks, family-friendly content",
          "💼 LinkedIn: Professional insights, industry commentary",
          "📧 Email: Newsletter-worthy summaries, exclusive content",
          "💬 WhatsApp: Conversation starters, surprising facts"
        ];
        
        return {
          content: [{
            type: "text",
            text: `Sharing Analytics (${startDate} to ${endDate})${videoId ? ` for video ${videoId}` : ''}:

📊 SHARING BREAKDOWN:
• Total Shares: ${totalShares.toLocaleString()}
${sortedServices.map(([service, count], index) => 
  `• ${index + 1}. ${service}: ${count.toLocaleString()} shares (${((count / totalShares) * 100).toFixed(1)}%)`
).join('\n')}

🎯 VIRAL POTENTIAL SCORE:
${totalShares > 100 ? '🚀 HIGH' : totalShares > 20 ? '📈 MEDIUM' : '📤 LOW'} (${totalShares} total shares)

💡 INSIGHTS:
${insights.map(insight => `${insight}`).join('\n')}

🚀 PLATFORM OPTIMIZATION STRATEGIES:
${strategies.map(strategy => `${strategy}`).join('\n')}

📈 SHARING IMPROVEMENT TACTICS:
• Create shareable moments: Surprising statistics, emotional stories
• Add share CTAs: "Share this with someone who needs to see it"
• Design for mobile: Most sharing happens on mobile devices
• Time releases strategically: Share during peak social media hours
• Create quote cards: Visual summaries for easy sharing

Raw Data:
${JSON.stringify(sharing, null, 2)}`
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

  // Card & End Screen Performance Tool
  server.tool(
    "get_card_endscreen_performance",
    "Get card and end screen performance metrics for viewer journey optimization and improving video-to-video transitions",
    {
      videoId: z.string().describe("Video ID to analyze (required for card/end screen data)"),
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)")
    },
    async ({ videoId, startDate, endDate }) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const cardEndScreen = await youtubeClient.getCardEndScreenPerformance({ 
          videoId, startDate, endDate 
        });
        
        // Extract metrics from the response
        let cardImpressions = 0;
        let cardClicks = 0;
        let cardClickRate = 0;
        let endScreenImpressions = 0;
        let endScreenClicks = 0;
        let endScreenClickRate = 0;
        
        if (cardEndScreen.rows && cardEndScreen.rows.length > 0) {
          // Assuming single row for specific video
          const row = cardEndScreen.rows[0];
          cardImpressions = parseInt(row[1]) || 0;
          cardClicks = parseInt(row[2]) || 0;
          cardClickRate = parseFloat(row[3]) || 0;
          endScreenImpressions = parseInt(row[4]) || 0;
          endScreenClicks = parseInt(row[5]) || 0;
          endScreenClickRate = parseFloat(row[6]) || 0;
        }
        
        // Generate performance insights
        const insights = [];
        
        // Card performance analysis
        if (cardClickRate > 5) {
          insights.push("🎯 Excellent card performance - strong viewer engagement");
        } else if (cardClickRate > 2) {
          insights.push("✅ Good card performance - cards are working well");
        } else if (cardImpressions > 0) {
          insights.push("⚠️ Low card click rate - optimize card placement and messaging");
        } else {
          insights.push("❌ No card data - consider adding cards to your videos");
        }
        
        // End screen performance analysis
        if (endScreenClickRate > 10) {
          insights.push("🎯 Excellent end screen performance - great viewer retention");
        } else if (endScreenClickRate > 5) {
          insights.push("✅ Good end screen performance - viewers are continuing journey");
        } else if (endScreenImpressions > 0) {
          insights.push("⚠️ Low end screen click rate - improve end screen design");
        } else {
          insights.push("❌ No end screen data - add end screens to keep viewers engaged");
        }
        
        // Optimization strategies
        const strategies = [
          "📍 Card Placement: Add cards at 30-60 seconds and mid-video",
          "🎨 Visual Design: Use compelling thumbnails for promoted videos",
          "📝 Messaging: Clear, benefit-focused card text",
          "⏰ Timing: Place cards during natural breaks or topic transitions",
          "🔗 Relevance: Promote related, high-performing content",
          "📱 Mobile Optimization: Test card visibility on mobile devices"
        ];
        
        return {
          content: [{
            type: "text",
            text: `Card & End Screen Performance for video ${videoId} (${startDate} to ${endDate}):

📊 CARDS PERFORMANCE:
• Impressions: ${cardImpressions.toLocaleString()}
• Clicks: ${cardClicks.toLocaleString()}
• Click Rate: ${cardClickRate.toFixed(2)}%

📊 END SCREEN PERFORMANCE:
• Impressions: ${endScreenImpressions.toLocaleString()}
• Clicks: ${endScreenClicks.toLocaleString()}
• Click Rate: ${endScreenClickRate.toFixed(2)}%

🎯 PERFORMANCE BENCHMARKS:
• Card Click Rate: >5% Excellent | 2-5% Good | <2% Needs Work
• End Screen Click Rate: >10% Excellent | 5-10% Good | <5% Needs Work

💡 PERFORMANCE INSIGHTS:
${insights.map(insight => `${insight}`).join('\n')}

🚀 OPTIMIZATION STRATEGIES:
${strategies.map(strategy => `${strategy}`).join('\n')}

📈 IMPROVEMENT TACTICS:
• Test different card types (video, playlist, channel, poll)
• Use compelling thumbnails for promoted content
• Add verbal CTAs before cards appear
• Optimize end screen layout for mobile viewing
• Promote your best-performing videos
• A/B test card timing and placement

🎯 SUCCESS METRICS TO TRACK:
• Session duration increase from cards/end screens
• Subscriber conversion from promoted content
• Playlist engagement from end screen promotions
• Click-through rates by card type and placement

Raw Data:
${JSON.stringify(cardEndScreen, null, 2)}`
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