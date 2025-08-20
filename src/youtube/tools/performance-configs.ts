import { z } from "zod";
import { ToolConfig, ToolContext, Formatters } from '../../types.js';

// Formatters for performance-related data presentation
const performanceFormatters: Formatters = {
  audienceRetention: (data: any): string => {
    if (!data || !data.rows || data.rows.length === 0) {
      return "No audience retention data available for the specified video and period.";
    }

    let output = "📊 Audience Retention Analysis:\n\n";
    
    // Calculate retention metrics
    const retentionData = data.rows.map((row: any[]) => ({
      timePercent: (row[0] || 0) * 100,
      retentionPercent: (row[1] || 0) * 100
    }));
    
    const firstRetention = retentionData[0]?.retentionPercent || 0;
    const lastRetention = retentionData[retentionData.length - 1]?.retentionPercent || 0;
    const averageRetention = retentionData.reduce((sum: number, point: any) => sum + point.retentionPercent, 0) / retentionData.length;
    
    output += `📈 Key Metrics:\n`;
    output += `• Average Retention: ${averageRetention.toFixed(1)}%\n`;
    output += `• Start Retention: ${firstRetention.toFixed(1)}%\n`;
    output += `• End Retention: ${lastRetention.toFixed(1)}%\n`;
    output += `• Total Drop: ${(firstRetention - lastRetention).toFixed(1)}%\n\n`;
    
    // Performance benchmarks
    if (averageRetention >= 50) {
      output += "🎯 Excellent: Above 50% average retention!\n";
    } else if (averageRetention >= 35) {
      output += "✅ Good: 35-50% retention is solid performance\n";
    } else if (averageRetention >= 25) {
      output += "⚠️ Fair: 25-35% retention needs improvement\n";
    } else {
      output += "🚨 Poor: Below 25% retention requires urgent attention\n";
    }
    
    // Critical moments analysis
    output += "\n🔍 Critical Moments:\n";
    
    const firstFifteenSeconds = retentionData.find((point: any) => point.timePercent >= 15);
    if (firstFifteenSeconds && (firstRetention - firstFifteenSeconds.retentionPercent) > 20) {
      output += "• 🚨 Hook Problem: Major drop in first 15 seconds\n";
    }
    
    const thirtyToSixtySeconds = retentionData.filter((point: any) => point.timePercent >= 30 && point.timePercent <= 60);
    if (thirtyToSixtySeconds.length > 0) {
      const avgDrop = thirtyToSixtySeconds.reduce((sum: number, point: any, index: number, arr: any[]) => {
        if (index === 0) return 0;
        return sum + (arr[index - 1].retentionPercent - point.retentionPercent);
      }, 0) / (thirtyToSixtySeconds.length - 1);
      
      if (avgDrop > 15) {
        output += "• ⚠️ Expectation Mismatch: High drops at 30-60 seconds\n";
      }
    }
    
    output += "\n💡 Improvement Strategies:\n";
    output += "• Hook: First 15 seconds should match title/thumbnail\n";
    output += "• Pacing: Maintain energy throughout, avoid slow sections\n";
    output += "• Payoff: Deliver on promises made in title/thumbnail\n";
    output += "• Structure: Use pattern interrupts every 30 seconds\n";

    return output;
  },

  retentionDropoffs: (dropOffPoints: any[]): string => {
    if (!dropOffPoints || dropOffPoints.length === 0) {
      return "✅ No significant retention drop-off points detected! Your video maintains good audience engagement throughout.";
    }

    let output = "🔍 Retention Drop-off Analysis:\n\n";
    
    // Sort by severity and drop amount
    const sortedDrops = dropOffPoints.sort((a, b) => b.dropAmount - a.dropAmount);
    
    output += `Found ${dropOffPoints.length} significant drop-off points:\n\n`;
    
    sortedDrops.forEach((drop, index) => {
      const severity = drop.severity === 'critical' ? '🚨' : '⚠️';
      output += `${severity} Drop ${index + 1}: ${drop.timePercent.toFixed(1)}% into video\n`;
      output += `   Audience Loss: ${drop.dropAmount.toFixed(1)}%\n`;
      output += `   Severity: ${drop.severity.toUpperCase()}\n\n`;
    });
    
    output += "🛠️ Action Plan:\n";
    
    const criticalDrops = dropOffPoints.filter(d => d.severity === 'critical').length;
    const warningDrops = dropOffPoints.filter(d => d.severity === 'warning').length;
    
    if (criticalDrops > 0) {
      output += `• ${criticalDrops} Critical drops require immediate attention\n`;
      output += "• Review content at these timestamps for:\n";
      output += "  - Slow/boring sections\n";
      output += "  - Technical issues\n";
      output += "  - Misleading expectations\n";
    }
    
    if (warningDrops > 0) {
      output += `• ${warningDrops} Warning drops need optimization\n`;
      output += "• Consider adding pattern interrupts\n";
      output += "• Improve pacing and energy\n";
    }
    
    output += "\n🎯 Target: <10% drops at any single point for optimal performance";

    return output;
  }
};

export const performanceTools: ToolConfig[] = [
  {
    name: "get_audience_retention",
    description: "Track where viewers leave videos - identifies hook problems, pacing issues, and engagement drops",
    category: "performance",
    schema: z.object({
      videoId: z.string().describe("Video ID to analyze"),
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)")
    }),
    formatters: performanceFormatters,
    handler: async ({ videoId, startDate, endDate }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        const retention = await youtubeClient.getAudienceRetention({ 
          videoId, startDate, endDate, metrics: [] 
        });
        const formattedText = performanceFormatters.audienceRetention(retention);
        
        return {
          content: [{
            type: "text",
            text: `Audience Retention for video ${videoId} (${startDate} to ${endDate}):

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
    name: "get_retention_dropoff_points",
    description: "Find exact moments losing viewers with severity levels - surgical precision for content improvement",
    category: "performance",
    schema: z.object({
      videoId: z.string().describe("Video ID to analyze"),
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)"),
      threshold: z.number().optional().default(0.1).describe("Drop threshold (default 0.1 = 10%)")
    }),
    formatters: performanceFormatters,
    handler: async ({ videoId, startDate, endDate, threshold }, { getYouTubeClient }: ToolContext) => {
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
        
        const formattedText = performanceFormatters.retentionDropoffs(dropOffPoints);
        
        return {
          content: [{
            type: "text",
            text: `Retention Drop-off Points for video ${videoId}:

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
];
