import { MetricTotals } from '../transformers/analytics.js';
import { EngagementRates, calculateEngagementRates, formatNumber, formatPercentage } from '../transformers/statistics.js';
import { DateRange } from '../parsers/analytics.js';

export interface EngagementInsight {
  message: string;
  type: 'positive' | 'warning' | 'negative';
}

export interface EngagementAnalysis {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  subscribersGained: number;
  subscribersLost: number;
  rates: EngagementRates;
  netSubscriberChange: number;
  insights: EngagementInsight[];
}

export function analyzeEngagement(metrics: MetricTotals): EngagementAnalysis {
  const totalViews = metrics.views || 0;
  const totalLikes = metrics.likes || 0;
  const totalComments = metrics.comments || 0;
  const totalShares = metrics.shares || 0;
  const subscribersGained = metrics.subscribersGained || 0;
  const subscribersLost = metrics.subscribersLost || 0;

  const rates = calculateEngagementRates(totalViews, totalLikes, totalComments, totalShares);
  const netSubscriberChange = subscribersGained - subscribersLost;

  const insights = generateEngagementInsights(rates, netSubscriberChange);

  return {
    totalViews,
    totalLikes,
    totalComments,
    totalShares,
    subscribersGained,
    subscribersLost,
    rates,
    netSubscriberChange,
    insights
  };
}

export function generateEngagementInsights(rates: EngagementRates, netSubscriberChange: number): EngagementInsight[] {
  const insights: EngagementInsight[] = [];

  if (rates.likeRate > 4) {
    insights.push({
      message: "🎯 Excellent like rate - content resonates strongly with audience",
      type: 'positive'
    });
  } else if (rates.likeRate > 2) {
    insights.push({
      message: "✅ Good like rate - content is well-received",
      type: 'positive'
    });
  } else {
    insights.push({
      message: "⚠️ Low like rate - consider improving content quality or thumbnails",
      type: 'warning'
    });
  }

  if (rates.commentRate > 1) {
    insights.push({
      message: "💬 High comment rate - content sparks discussion",
      type: 'positive'
    });
  } else if (rates.commentRate > 0.5) {
    insights.push({
      message: "💬 Moderate comment rate - some audience engagement",
      type: 'positive'
    });
  } else {
    insights.push({
      message: "💬 Low comment rate - consider call-to-actions or controversial topics",
      type: 'warning'
    });
  }

  if (rates.shareRate > 0.5) {
    insights.push({
      message: "🚀 High share rate - viral potential content",
      type: 'positive'
    });
  } else if (rates.shareRate > 0.1) {
    insights.push({
      message: "📤 Moderate share rate - decent viral potential",
      type: 'positive'
    });
  } else {
    insights.push({
      message: "📤 Low share rate - content needs more shareability",
      type: 'warning'
    });
  }

  if (netSubscriberChange > 0) {
    insights.push({
      message: `📈 Positive subscriber growth: +${formatNumber(netSubscriberChange)}`,
      type: 'positive'
    });
  } else if (netSubscriberChange < 0) {
    insights.push({
      message: `📉 Subscriber loss: ${formatNumber(netSubscriberChange)}`,
      type: 'negative'
    });
  }

  return insights;
}

export function formatEngagementMetrics(analysis: EngagementAnalysis, dateInfo?: DateRange & { videoId?: string }): string {
  let output = `💫 Engagement Analysis`;
  if (dateInfo) {
    output += ` (${dateInfo.startDate} to ${dateInfo.endDate})`;
    if (dateInfo.videoId) output += ` for video ${dateInfo.videoId}`;
  }
  output += ":\n\n";

  // Engagement Summary
  output += "📊 ENGAGEMENT SUMMARY:\n";
  output += `• Total Views: ${formatNumber(analysis.totalViews)}\n`;
  output += `• Total Likes: ${formatNumber(analysis.totalLikes)} (${formatPercentage(analysis.rates.likeRate, 2)} rate)\n`;
  output += `• Total Comments: ${formatNumber(analysis.totalComments)} (${formatPercentage(analysis.rates.commentRate, 2)} rate)\n`;
  output += `• Total Shares: ${formatNumber(analysis.totalShares)} (${formatPercentage(analysis.rates.shareRate, 2)} rate)\n`;
  output += `• Net Subscriber Change: ${analysis.netSubscriberChange > 0 ? '+' : ''}${formatNumber(analysis.netSubscriberChange)}\n\n`;

  // Performance Benchmarks
  output += "🎯 PERFORMANCE BENCHMARKS:\n";
  output += "• Like Rate: >4% Excellent | 2-4% Good | <2% Needs Work\n";
  output += "• Comment Rate: >1% High | 0.5-1% Moderate | <0.5% Low\n";
  output += "• Share Rate: >0.5% Viral | 0.1-0.5% Good | <0.1% Low\n\n";

  // Performance Insights
  output += "💡 INSIGHTS:\n";
  analysis.insights.forEach(insight => {
    output += `${insight.message}\n`;
  });

  // Improvement Strategies
  output += "\n📈 IMPROVEMENT STRATEGIES:\n";
  output += "• Increase likes: Better thumbnails, stronger hooks, quality content\n";
  output += "• Boost comments: Ask questions, controversial takes, community posts\n";
  output += "• Drive shares: Emotional content, trending topics, surprising facts\n";
  output += "• Grow subscribers: Consistent uploads, clear value proposition, CTAs\n";

  return output;
}