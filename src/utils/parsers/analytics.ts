import { ParsedAnalytics, ColumnHeader, MetricTotals, parseAnalyticsResponse } from '../transformers/analytics.js';

export { parseAnalyticsResponse };

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface DemographicData {
  ageGroup: string;
  gender: string;
  viewerPercentage: number;
}

export interface GeographicData {
  country: string;
  views: number;
  estimatedMinutesWatched: number;
  averageViewDuration: number;
}

export interface SubscriberData {
  subscribedStatus: string;
  views: number;
  estimatedMinutesWatched: number;
  averageViewDuration: number;
}

export interface TrafficSourceData {
  sourceType: string;
  views: number;
  estimatedMinutesWatched: number;
}

export interface SearchTermData {
  searchTerm: string;
  views: number;
}

export function parseDemographics(data: ParsedAnalytics): DemographicData[] {
  if (!data.rows || data.rows.length === 0) return [];
  
  return data.rows.map(row => {
    const demographic = row[0] || '';
    const viewerPercentage = Number(row[1] || 0);
    
    let ageGroup = '';
    let gender = '';
    
    if (demographic.includes('.')) {
      [ageGroup, gender] = demographic.split('.');
    } else {
      ageGroup = demographic;
      gender = 'unknown';
    }
    
    return {
      ageGroup: ageGroup.replace('age', 'Ages ').replace('-', '-'),
      gender: gender.charAt(0).toUpperCase() + gender.slice(1),
      viewerPercentage
    };
  });
}

export function parseGeographic(data: ParsedAnalytics): GeographicData[] {
  if (!data.rows || data.rows.length === 0) return [];
  
  return data.rows.map(row => ({
    country: row[0] || 'Unknown',
    views: Number(row[1] || 0),
    estimatedMinutesWatched: Number(row[2] || 0),
    averageViewDuration: Number(row[3] || 0)
  })).sort((a, b) => b.views - a.views);
}

export function parseSubscriberAnalytics(data: ParsedAnalytics): SubscriberData[] {
  if (!data.rows || data.rows.length === 0) return [];
  
  return data.rows.map(row => ({
    subscribedStatus: row[0] || 'unknown',
    views: Number(row[1] || 0),
    estimatedMinutesWatched: Number(row[2] || 0),
    averageViewDuration: Number(row[3] || 0)
  }));
}

export function parseTrafficSources(data: ParsedAnalytics): TrafficSourceData[] {
  if (!data.rows || data.rows.length === 0) return [];
  
  return data.rows.map(row => ({
    sourceType: row[0] || 'Unknown',
    views: Number(row[1] || 0),
    estimatedMinutesWatched: Number(row[2] || 0)
  })).sort((a, b) => b.views - a.views);
}

export function parseSearchTerms(data: ParsedAnalytics): SearchTermData[] {
  if (!data.rows || data.rows.length === 0) return [];
  
  return data.rows.map(row => ({
    searchTerm: row[0] || 'Unknown',
    views: Number(row[1] || 0)
  })).sort((a, b) => b.views - a.views);
}

export function parseEngagementMetrics(data: ParsedAnalytics): MetricTotals {
  if (!data.rows || data.rows.length === 0) {
    return {};
  }

  let totalViews = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;
  let subscribersGained = 0;
  let subscribersLost = 0;
  
  data.rows.forEach((row: any[]) => {
    totalLikes += parseInt(row[1]) || 0;
    totalComments += parseInt(row[3]) || 0;
    totalShares += parseInt(row[4]) || 0;
    subscribersGained += parseInt(row[5]) || 0;
    subscribersLost += parseInt(row[6]) || 0;
    totalViews += parseInt(row[7]) || 0;
  });
  
  return {
    views: totalViews,
    likes: totalLikes,
    comments: totalComments,
    shares: totalShares,
    subscribersGained,
    subscribersLost
  };
}

export function parseComparisonMetrics(data: any): {
  period1Data: ParsedAnalytics;
  period2Data: ParsedAnalytics;
  period1Info: { period: string };
  period2Info: { period: string };
  changePercent: number;
} | null {
  if (!data || !data.period1 || !data.period2) {
    return null;
  }

  return {
    period1Data: data.period1.data,
    period2Data: data.period2.data,
    period1Info: { period: data.period1.period },
    period2Info: { period: data.period2.period },
    changePercent: data.changePercent || 0
  };
}