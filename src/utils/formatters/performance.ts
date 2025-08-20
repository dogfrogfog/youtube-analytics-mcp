import { RetentionPoint, RetentionMetrics, calculateRetentionMetrics, parseRetentionData, formatPercentage } from '../transformers/statistics.js';
import { ParsedAnalytics } from '../transformers/analytics.js';

export interface DropOffPoint {
  timePercent: number;
  dropAmount: number;
  severity: 'critical' | 'warning';
}

export interface CriticalMoment {
  type: 'hook_problem' | 'expectation_mismatch';
  description: string;
  timeRange: string;
}

export interface RetentionAnalysis {
  metrics: RetentionMetrics;
  retentionData: RetentionPoint[];
  criticalMoments: CriticalMoment[];
  performanceRating: 'excellent' | 'good' | 'fair' | 'poor';
}

export function analyzeAudienceRetention(data: ParsedAnalytics): RetentionAnalysis {
  if (!data.rows || data.rows.length === 0) {
    return {
      metrics: { averageRetention: 0, startRetention: 0, endRetention: 0, totalDrop: 0 },
      retentionData: [],
      criticalMoments: [],
      performanceRating: 'poor'
    };
  }

  const retentionData = parseRetentionData(data.rows);
  const metrics = calculateRetentionMetrics(retentionData);
  const criticalMoments = findCriticalMoments(retentionData);
  const performanceRating = evaluateRetentionPerformance(metrics.averageRetention);

  return {
    metrics,
    retentionData,
    criticalMoments,
    performanceRating
  };
}

export function findCriticalMoments(retentionData: RetentionPoint[]): CriticalMoment[] {
  const moments: CriticalMoment[] = [];
  
  if (retentionData.length === 0) return moments;

  const firstRetention = retentionData[0]?.retentionPercent || 0;
  
  // Hook problem detection
  const firstFifteenSeconds = retentionData.find(point => point.timePercent >= 15);
  if (firstFifteenSeconds && (firstRetention - firstFifteenSeconds.retentionPercent) > 20) {
    moments.push({
      type: 'hook_problem',
      description: 'Major drop in first 15 seconds',
      timeRange: '0-15 seconds'
    });
  }
  
  // Expectation mismatch detection
  const thirtyToSixtySeconds = retentionData.filter(point => point.timePercent >= 30 && point.timePercent <= 60);
  if (thirtyToSixtySeconds.length > 0) {
    const avgDrop = thirtyToSixtySeconds.reduce((sum, point, index, arr) => {
      if (index === 0) return 0;
      return sum + (arr[index - 1].retentionPercent - point.retentionPercent);
    }, 0) / (thirtyToSixtySeconds.length - 1);
    
    if (avgDrop > 15) {
      moments.push({
        type: 'expectation_mismatch',
        description: 'High drops at 30-60 seconds',
        timeRange: '30-60 seconds'
      });
    }
  }
  
  return moments;
}

export function evaluateRetentionPerformance(averageRetention: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (averageRetention >= 50) return 'excellent';
  if (averageRetention >= 35) return 'good';
  if (averageRetention >= 25) return 'fair';
  return 'poor';
}

export function formatAudienceRetention(analysis: RetentionAnalysis): string {
  let output = "📊 Audience Retention Analysis:\n\n";
  
  const { metrics, criticalMoments, performanceRating } = analysis;
  
  output += `📈 Key Metrics:\n`;
  output += `• Average Retention: ${formatPercentage(metrics.averageRetention)}\n`;
  output += `• Start Retention: ${formatPercentage(metrics.startRetention)}\n`;
  output += `• End Retention: ${formatPercentage(metrics.endRetention)}\n`;
  output += `• Total Drop: ${formatPercentage(metrics.totalDrop)}\n\n`;
  
  // Performance benchmarks
  switch (performanceRating) {
    case 'excellent':
      output += "🎯 Excellent: Above 50% average retention!\n";
      break;
    case 'good':
      output += "✅ Good: 35-50% retention is solid performance\n";
      break;
    case 'fair':
      output += "⚠️ Fair: 25-35% retention needs improvement\n";
      break;
    case 'poor':
      output += "🚨 Poor: Below 25% retention requires urgent attention\n";
      break;
  }
  
  // Critical moments analysis
  if (criticalMoments.length > 0) {
    output += "\n🔍 Critical Moments:\n";
    criticalMoments.forEach(moment => {
      const icon = moment.type === 'hook_problem' ? '🚨' : '⚠️';
      output += `• ${icon} ${moment.description} (${moment.timeRange})\n`;
    });
  }
  
  output += "\n💡 Improvement Strategies:\n";
  output += "• Hook: First 15 seconds should match title/thumbnail\n";
  output += "• Pacing: Maintain energy throughout, avoid slow sections\n";
  output += "• Payoff: Deliver on promises made in title/thumbnail\n";
  output += "• Structure: Use pattern interrupts every 30 seconds\n";

  return output;
}

export function findDropOffPoints(data: ParsedAnalytics, threshold: number = 0.1): DropOffPoint[] {
  if (!data.rows || data.rows.length <= 1) return [];
  
  const dropOffPoints: DropOffPoint[] = [];
  
  for (let i = 1; i < data.rows.length; i++) {
    const drop = data.rows[i-1][1] - data.rows[i][1];
    if (drop > threshold) {
      dropOffPoints.push({
        timePercent: data.rows[i][0] * 100,
        dropAmount: drop * 100,
        severity: drop > 0.2 ? 'critical' : 'warning'
      });
    }
  }
  
  return dropOffPoints;
}

export function formatRetentionDropoffs(dropOffPoints: DropOffPoint[]): string {
  if (!dropOffPoints || dropOffPoints.length === 0) {
    return "✅ No significant retention drop-off points detected! Your video maintains good audience engagement throughout.";
  }

  let output = "🔍 Retention Drop-off Analysis:\n\n";
  
  // Sort by severity and drop amount
  const sortedDrops = dropOffPoints.sort((a, b) => b.dropAmount - a.dropAmount);
  
  output += `Found ${dropOffPoints.length} significant drop-off points:\n\n`;
  
  sortedDrops.forEach((drop, index) => {
    const severity = drop.severity === 'critical' ? '🚨' : '⚠️';
    output += `${severity} Drop ${index + 1}: ${formatPercentage(drop.timePercent)} into video\n`;
    output += `   Audience Loss: ${formatPercentage(drop.dropAmount)}\n`;
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

export function generatePerformanceInsights(analysis: RetentionAnalysis): string[] {
  const insights: string[] = [];
  
  // Overall performance insight
  switch (analysis.performanceRating) {
    case 'excellent':
      insights.push("🏆 Outstanding retention performance - audience is highly engaged");
      break;
    case 'good':
      insights.push("✅ Solid retention performance - content quality is strong");
      break;
    case 'fair':
      insights.push("📈 Room for improvement - focus on pacing and hooks");
      break;
    case 'poor':
      insights.push("🚨 Significant retention issues - major content revision needed");
      break;
  }
  
  // Critical moments insights
  if (analysis.criticalMoments.some(m => m.type === 'hook_problem')) {
    insights.push("🎣 Hook needs improvement - first impression not matching expectations");
  }
  
  if (analysis.criticalMoments.some(m => m.type === 'expectation_mismatch')) {
    insights.push("⚠️ Title/thumbnail may be misleading - content not delivering on promise");
  }
  
  // Drop analysis
  if (analysis.metrics.totalDrop > 80) {
    insights.push("📉 Extremely high drop rate - consider shorter format or better pacing");
  } else if (analysis.metrics.totalDrop > 60) {
    insights.push("📊 High drop rate - focus on maintaining interest throughout");
  }
  
  return insights;
}