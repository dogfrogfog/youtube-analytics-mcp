import { DemographicData, GeographicData, SubscriberData } from '../parsers/analytics.js';
import { formatNumber, formatPercentage } from '../transformers/statistics.js';

export interface AgeGenderBreakdown {
  [ageGroup: string]: {
    [gender: string]: number;
  };
}

export function formatDemographics(demographicData: DemographicData[]): string {
  if (!demographicData || demographicData.length === 0) {
    return "No demographic data available for the specified period.";
  }

  let output = "👥 Audience Demographics:\n\n";
  
  // Group data by age and gender
  const ageGenderData: AgeGenderBreakdown = {};
  
  demographicData.forEach(data => {
    if (!ageGenderData[data.ageGroup]) {
      ageGenderData[data.ageGroup] = {};
    }
    ageGenderData[data.ageGroup][data.gender] = data.viewerPercentage;
  });
  
  if (Object.keys(ageGenderData).length > 0) {
    output += "📊 Age & Gender Breakdown:\n";
    Object.entries(ageGenderData).forEach(([age, genderData]) => {
      output += `\n${age}:\n`;
      Object.entries(genderData).forEach(([gender, percentage]) => {
        output += `  👤 ${gender}: ${formatPercentage(percentage)}%\n`;
      });
    });
  } else {
    // Fallback to simple display
    demographicData.forEach(data => {
      output += `${data.ageGroup} ${data.gender}: ${formatPercentage(data.viewerPercentage)}%\n`;
    });
  }

  return output + "\n💡 Use this data to tailor your content to your primary audience segments.";
}

export function formatGeographicDistribution(geographicData: GeographicData[]): string {
  if (!geographicData || geographicData.length === 0) {
    return "No geographic data available for the specified period.";
  }

  let output = "🌍 Geographic Distribution:\n\n";
  
  const totalViews = geographicData.reduce((sum, data) => sum + data.views, 0);
  
  output += `Total Views Analyzed: ${formatNumber(totalViews)}\n\n`;
  output += "📊 Top Countries:\n";
  
  geographicData.slice(0, 10).forEach((data, index) => {
    const percentage = totalViews > 0 ? ((data.views / totalViews) * 100) : 0;
    output += `${index + 1}. 🏴 ${data.country}: ${formatNumber(data.views)} views (${formatPercentage(percentage)}%)\n`;
  });

  if (geographicData.length > 10) {
    const remainingViews = geographicData.slice(10).reduce((sum, data) => sum + data.views, 0);
    const remainingPercentage = totalViews > 0 ? ((remainingViews / totalViews) * 100) : 0;
    output += `... and ${geographicData.length - 10} other countries (${formatNumber(remainingViews)} views, ${formatPercentage(remainingPercentage)}%)\n`;
  }

  return output + "\n💡 Consider creating content in languages spoken by your top geographic markets.";
}

export function formatSubscriberAnalytics(subscriberData: SubscriberData[]): string {
  if (!subscriberData || subscriberData.length === 0) {
    return "No subscriber analytics data available for the specified period.";
  }

  let output = "📈 Subscriber vs Non-Subscriber Analytics:\n\n";
  
  let subscriberViews = 0;
  let nonSubscriberViews = 0;
  
  subscriberData.forEach(data => {
    if (data.subscribedStatus && data.subscribedStatus.toLowerCase().includes('subscribed')) {
      subscriberViews += data.views;
    } else {
      nonSubscriberViews += data.views;
    }
  });
  
  const totalViews = subscriberViews + nonSubscriberViews;
  
  if (totalViews > 0) {
    const subscriberPercentage = (subscriberViews / totalViews) * 100;
    const nonSubscriberPercentage = (nonSubscriberViews / totalViews) * 100;
    
    output += `📊 View Distribution:\n`;
    output += `👥 Subscriber Views: ${formatNumber(subscriberViews)} (${formatPercentage(subscriberPercentage)}%)\n`;
    output += `🆕 Non-Subscriber Views: ${formatNumber(nonSubscriberViews)} (${formatPercentage(nonSubscriberPercentage)}%)\n\n`;
    
    // Growth insights
    if (nonSubscriberPercentage > 50) {
      output += "🚀 Growth Opportunity: Most views come from non-subscribers - focus on converting them!\n";
      output += "💡 Strategy: Add clear subscribe calls-to-action and create compelling end screens.\n";
    } else {
      output += "🎯 Loyal Audience: Strong subscriber engagement indicates good content-audience fit.\n";
      output += "💡 Strategy: Continue serving your subscriber base while attracting new viewers.\n";
    }
  }

  return output;
}

export function generateAudienceInsights(geographicData: GeographicData[], subscriberData: SubscriberData[]): string[] {
  const insights: string[] = [];
  
  // Geographic insights
  if (geographicData && geographicData.length > 0) {
    const topCountry = geographicData[0];
    const totalViews = geographicData.reduce((sum, data) => sum + data.views, 0);
    const topCountryPercentage = totalViews > 0 ? (topCountry.views / totalViews) * 100 : 0;
    
    if (topCountryPercentage > 50) {
      insights.push(`🎯 Geographic Concentration: ${topCountry.country} represents ${formatPercentage(topCountryPercentage)}% of views`);
    }
    
    if (geographicData.length >= 5) {
      const top5Percentage = geographicData.slice(0, 5).reduce((sum, data) => sum + data.views, 0) / totalViews * 100;
      insights.push(`🌍 Global Reach: Top 5 countries account for ${formatPercentage(top5Percentage)}% of views`);
    }
  }
  
  // Subscriber insights
  if (subscriberData && subscriberData.length > 0) {
    let subscriberViews = 0;
    let nonSubscriberViews = 0;
    
    subscriberData.forEach(data => {
      if (data.subscribedStatus && data.subscribedStatus.toLowerCase().includes('subscribed')) {
        subscriberViews += data.views;
      } else {
        nonSubscriberViews += data.views;
      }
    });
    
    const totalViews = subscriberViews + nonSubscriberViews;
    const subscriberPercentage = totalViews > 0 ? (subscriberViews / totalViews) * 100 : 0;
    
    if (subscriberPercentage > 70) {
      insights.push("🔒 High Subscriber Loyalty: Strong repeat viewership");
    } else if (subscriberPercentage < 30) {
      insights.push("📈 High Discovery Potential: Attracting many new viewers");
    }
  }
  
  return insights;
}