import { ParsedAnalytics, ColumnHeader, calculatePercentageChange } from '../transformers/analytics.js';
import { formatNumber, formatPercentage } from '../transformers/statistics.js';
import { parseComparisonMetrics } from '../parsers/analytics.js';

export interface ChannelOverviewData {
  totalViews: number;
  estimatedMinutesWatched: number;
  subscribersGained: number;
  averageViewDuration: number;
  averageViewPercentage?: number;
}

export interface ComparisonData {
  period1: ChannelOverviewData;
  period2: ChannelOverviewData;
  period1Info: { period: string };
  period2Info: { period: string };
  changes: {
    [metric: string]: {
      oldValue: number;
      newValue: number;
      change: number;
      percentChange: number;
      direction: '📈' | '📉' | '➡️';
    };
  };
}

export function parseChannelOverview(data: ParsedAnalytics): ChannelOverviewData {
  if (!data.rows || data.rows.length === 0) {
    return {
      totalViews: 0,
      estimatedMinutesWatched: 0,
      subscribersGained: 0,
      averageViewDuration: 0
    };
  }

  const metrics = data.columnHeaders?.map((header: ColumnHeader) => header.name) || [];
  const totalRow = data.rows[0] || [];
  
  const result: ChannelOverviewData = {
    totalViews: 0,
    estimatedMinutesWatched: 0,
    subscribersGained: 0,
    averageViewDuration: 0
  };
  
  metrics.forEach((metric: string, index: number) => {
    const value = Number(totalRow[index] || 0);
    
    switch (metric) {
      case 'views':
        result.totalViews = value;
        break;
      case 'estimatedMinutesWatched':
        result.estimatedMinutesWatched = value;
        break;
      case 'subscribersGained':
        result.subscribersGained = value;
        break;
      case 'averageViewDuration':
        result.averageViewDuration = value;
        break;
      case 'averageViewPercentage':
        result.averageViewPercentage = value;
        break;
    }
  });

  return result;
}

export function formatChannelOverview(data: ChannelOverviewData, period?: string): string {
  let output = "Channel Health Overview:\n\n";
  
  output += "📊 Key Metrics:\n";
  output += `• Total Views: ${formatNumber(data.totalViews)}\n`;
  output += `• Watch Time (minutes): ${formatNumber(data.estimatedMinutesWatched)}\n`;
  output += `• Subscribers Gained: ${formatNumber(data.subscribersGained)}\n`;
  output += `• Average View Duration: ${data.averageViewDuration.toFixed(1)} seconds\n`;
  
  if (data.averageViewPercentage !== undefined) {
    output += `• Average View Percentage: ${formatPercentage(data.averageViewPercentage)}\n`;
  }

  if (period) {
    output += `\nNote: This represents aggregate performance for ${period}.`;
  } else {
    output += "\nNote: This represents aggregate performance for the selected time period.";
  }

  return output;
}

export function parseComparisonData(comparisonResult: any): ComparisonData | null {
  const parsed = parseComparisonMetrics(comparisonResult);
  if (!parsed) return null;

  const period1Data = parseChannelOverview(parsed.period1Data);
  const period2Data = parseChannelOverview(parsed.period2Data);

  const changes: ComparisonData['changes'] = {};
  
  // Calculate changes for each metric
  const metricsToCompare = [
    { key: 'views', name: 'Views', p1: period1Data.totalViews, p2: period2Data.totalViews },
    { key: 'estimatedMinutesWatched', name: 'Watch Time', p1: period1Data.estimatedMinutesWatched, p2: period2Data.estimatedMinutesWatched },
    { key: 'subscribersGained', name: 'Subscribers', p1: period1Data.subscribersGained, p2: period2Data.subscribersGained }
  ];

  metricsToCompare.forEach(metric => {
    const change = metric.p1 - metric.p2;
    const percentChange = calculatePercentageChange(metric.p2, metric.p1);
    const direction = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';

    changes[metric.key] = {
      oldValue: metric.p2,
      newValue: metric.p1,
      change,
      percentChange,
      direction
    };
  });

  return {
    period1: period1Data,
    period2: period2Data,
    period1Info: parsed.period1Info,
    period2Info: parsed.period2Info,
    changes
  };
}

export function formatComparisonMetrics(comparisonData: ComparisonData): string {
  let output = "📈 Period-to-Period Comparison:\n\n";
  
  Object.entries(comparisonData.changes).forEach(([key, data]) => {
    let label = '';
    switch (key) {
      case 'views':
        label = 'Views';
        break;
      case 'estimatedMinutesWatched':
        label = 'Watch Time';
        break;
      case 'subscribersGained':
        label = 'Subscribers';
        break;
      default:
        label = key;
    }
    
    output += `${data.direction} ${label}: ${formatNumber(data.oldValue)} → ${formatNumber(data.newValue)} `;
    output += `(${data.change >= 0 ? '+' : ''}${formatNumber(data.change)}, ${formatPercentage(data.percentChange)})\n`;
  });

  return output;
}

export function generateHealthInsights(overviewData: ChannelOverviewData): string[] {
  const insights: string[] = [];
  
  // View duration insights
  if (overviewData.averageViewDuration > 0) {
    if (overviewData.averageViewDuration > 120) { // > 2 minutes
      insights.push("🎯 Excellent engagement: High average view duration");
    } else if (overviewData.averageViewDuration > 60) { // 1-2 minutes
      insights.push("✅ Good engagement: Moderate view duration");
    } else {
      insights.push("⚠️ Short view duration: Content may need better hooks");
    }
  }
  
  // Subscriber growth insights
  if (overviewData.subscribersGained > 100) {
    insights.push("📈 Strong growth: High subscriber acquisition");
  } else if (overviewData.subscribersGained > 10) {
    insights.push("📈 Steady growth: Consistent subscriber gains");
  } else if (overviewData.subscribersGained <= 0) {
    insights.push("⚠️ Growth concern: Low or negative subscriber change");
  }
  
  // Watch time insights
  if (overviewData.estimatedMinutesWatched > 10000) {
    insights.push("🔥 High watch time: Strong content performance");
  } else if (overviewData.estimatedMinutesWatched > 1000) {
    insights.push("✅ Decent watch time: Content is engaging viewers");
  }
  
  return insights;
}