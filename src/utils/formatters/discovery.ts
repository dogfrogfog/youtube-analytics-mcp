import { ParsedAnalytics } from '../transformers/analytics.js';
import { formatNumber } from '../transformers/statistics.js';
import { TrafficSourceData, SearchTermData } from '../parsers/analytics.js';

export interface DayOfWeekData {
  dayOfWeek: string;
  avgViews: number;
  avgWatchTime: number;
  avgSubscribers: number;
  totalDays: number;
}

export interface BestPerformingDay {
  date: string;
  views: number;
  watchTime: number;
  subscribers: number;
  score: number;
}

export interface OptimalPostingAnalysis {
  dayOfWeekAnalysis: DayOfWeekData[];
  bestPerformingDays: BestPerformingDay[];
  hasData: boolean;
}

export function analyzeDayOfWeekPatterns(analyticsData: ParsedAnalytics): DayOfWeekData[] {
  if (!analyticsData.rows || analyticsData.rows.length === 0) {
    return [];
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

export function identifyBestDays(analyticsData: ParsedAnalytics): BestPerformingDay[] {
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
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

export function analyzeOptimalPostingTime(analyticsData: ParsedAnalytics): OptimalPostingAnalysis {
  const dayOfWeekAnalysis = analyzeDayOfWeekPatterns(analyticsData);
  const bestPerformingDays = identifyBestDays(analyticsData);
  
  return {
    dayOfWeekAnalysis,
    bestPerformingDays,
    hasData: dayOfWeekAnalysis.length > 0 || bestPerformingDays.length > 0
  };
}

export function formatOptimalPostingTime(analysis: OptimalPostingAnalysis): string {
  if (!analysis.hasData) {
    return "No data available for optimal posting time analysis.";
  }

  let output = "📅 Optimal Posting Time Analysis:\n\n";
  
  // Best performing days section
  if (analysis.bestPerformingDays.length > 0) {
    output += "🎯 Top 5 Best Performing Days:\n";
    analysis.bestPerformingDays.slice(0, 5).forEach((day, index) => {
      output += `${index + 1}. ${day.date}: ${formatNumber(day.views)} views, ${formatNumber(day.watchTime)} min watch time (Score: ${day.score.toFixed(1)})\n`;
    });
    output += "\n";
  }
  
  // Day of week insights
  if (analysis.dayOfWeekAnalysis.length > 0) {
    output += "📊 Day of Week Performance:\n";
    analysis.dayOfWeekAnalysis.forEach((day) => {
      output += `${day.dayOfWeek}: Avg ${formatNumber(day.avgViews)} views, ${formatNumber(day.avgWatchTime)} min watch time (${day.totalDays} days)\n`;
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
}

export function formatTrafficSources(trafficData: TrafficSourceData[]): string {
  if (!trafficData || trafficData.length === 0) {
    return "No traffic source data available for the specified period.";
  }

  let output = "🚀 Traffic Source Analysis:\n\n";
  
  const totalViews = trafficData.reduce((sum, source) => sum + source.views, 0);
  
  output += `Total Views Analyzed: ${formatNumber(totalViews)}\n\n`;
  output += "📊 Traffic Sources (by views):\n";
  
  trafficData.forEach((source, index) => {
    const percentage = totalViews > 0 ? ((source.views / totalViews) * 100) : 0;
    output += `${index + 1}. 📊 ${source.sourceType}: ${formatNumber(source.views)} views (${percentage.toFixed(1)}%)\n`;
    if (source.estimatedMinutesWatched > 0) {
      output += `   ⏱️ Watch Time: ${formatNumber(source.estimatedMinutesWatched)} minutes\n`;
    }
  });

  return output + "\n💡 Focus optimization efforts on your top traffic sources for maximum impact.";
}

export function formatSearchTerms(searchData: SearchTermData[]): string {
  if (!searchData || searchData.length === 0) {
    return "No search terms data available for the specified video and period.";
  }

  let output = "🔍 Search Terms Analysis:\n\n";
  
  const totalViews = searchData.reduce((sum, term) => sum + term.views, 0);
  
  output += `Total Search Views: ${formatNumber(totalViews)}\n\n`;
  output += "📊 Top Search Terms:\n";
  
  searchData.forEach((term, index) => {
    const percentage = totalViews > 0 ? ((term.views / totalViews) * 100) : 0;
    output += `${index + 1}. "${term.searchTerm}": ${formatNumber(term.views)} views (${percentage.toFixed(1)}%)\n`;
  });

  return output + "\n💡 Use these terms to optimize your titles, descriptions, and tags for better discoverability.";
}

export function generateDiscoveryInsights(trafficData: TrafficSourceData[], searchData: SearchTermData[]): string[] {
  const insights: string[] = [];
  
  // Traffic source insights
  if (trafficData && trafficData.length > 0) {
    const topSource = trafficData[0];
    const totalViews = trafficData.reduce((sum, source) => sum + source.views, 0);
    const topSourcePercentage = totalViews > 0 ? (topSource.views / totalViews) * 100 : 0;
    
    if (topSourcePercentage > 50) {
      insights.push(`🎯 Heavy dependence on ${topSource.sourceType} (${topSourcePercentage.toFixed(1)}%)`);
    }
    
    // Look for specific traffic sources
    const youtubeSearchTraffic = trafficData.find(source => 
      source.sourceType.toLowerCase().includes('search') || 
      source.sourceType.toLowerCase().includes('yt_search')
    );
    if (youtubeSearchTraffic) {
      const searchPercentage = totalViews > 0 ? (youtubeSearchTraffic.views / totalViews) * 100 : 0;
      if (searchPercentage > 30) {
        insights.push("🔍 Strong search discoverability - good SEO optimization");
      } else if (searchPercentage < 10) {
        insights.push("📈 Opportunity: Improve search optimization (titles, tags, descriptions)");
      }
    }
    
    const externalTraffic = trafficData.find(source => 
      source.sourceType.toLowerCase().includes('external') ||
      source.sourceType.toLowerCase().includes('social')
    );
    if (externalTraffic) {
      insights.push("🌐 External promotion is working - content is being shared");
    }
  }
  
  // Search terms insights
  if (searchData && searchData.length > 0) {
    if (searchData.length >= 10) {
      insights.push("🎯 Good keyword diversity - ranking for multiple search terms");
    } else if (searchData.length <= 3) {
      insights.push("📊 Limited keyword reach - consider broader content topics");
    }
    
    // Look for branded vs generic searches
    const totalSearchViews = searchData.reduce((sum, term) => sum + term.views, 0);
    const brandedSearches = searchData.filter(term => 
      term.searchTerm.toLowerCase().includes('channel') ||
      term.searchTerm.toLowerCase().includes('brand')
    );
    if (brandedSearches.length > 0) {
      const brandedPercentage = brandedSearches.reduce((sum, term) => sum + term.views, 0) / totalSearchViews * 100;
      if (brandedPercentage > 30) {
        insights.push("🏷️ Strong brand recognition - people search for you by name");
      }
    }
  }
  
  return insights;
}