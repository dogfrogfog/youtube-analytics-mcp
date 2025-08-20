import { formatNumber } from '../transformers/statistics.js';

export interface ChannelInfo {
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl?: string;
    publishedAt: string;
    thumbnails: any;
    country?: string;
  };
  statistics: {
    viewCount: string;
    subscriberCount: string;
    hiddenSubscriberCount: boolean;
    videoCount: string;
  };
}

export interface VideoListData {
  videos: any[];
  filterOptions?: {
    query?: string;
    startDate?: string;
    endDate?: string;
  };
}

export function formatChannelInfo(channelInfo: ChannelInfo): string {
  if (!channelInfo) {
    return "No channel information available.";
  }

  let output = "📺 Channel Information:\n\n";
  output += `🏷️ Name: ${channelInfo.snippet?.title || 'N/A'}\n`;
  output += `🆔 Channel ID: ${channelInfo.id || 'N/A'}\n`;
  
  // Format statistics with proper number formatting
  if (channelInfo.statistics) {
    const stats = channelInfo.statistics;
    output += `👥 Subscribers: ${parseInt(stats.subscriberCount || '0').toLocaleString()}\n`;
    output += `👁️ Total Views: ${parseInt(stats.viewCount || '0').toLocaleString()}\n`;
    output += `📹 Video Count: ${parseInt(stats.videoCount || '0').toLocaleString()}\n`;
  }
  
  if (channelInfo.snippet?.publishedAt) {
    output += `📅 Published: ${new Date(channelInfo.snippet.publishedAt).toLocaleDateString()}\n`;
  }
  
  if (channelInfo.snippet?.customUrl) {
    output += `🔗 Custom URL: ${channelInfo.snippet.customUrl}\n`;
  }
  
  if (channelInfo.snippet?.country) {
    output += `🌍 Country: ${channelInfo.snippet.country}\n`;
  }
  
  if (channelInfo.snippet?.description) {
    const desc = channelInfo.snippet.description;
    output += `\n📝 Description:\n${desc.slice(0, 300)}${desc.length > 300 ? '...' : ''}`;
  }

  return output;
}

export function formatVideoList(data: VideoListData): string {
  const { videos, filterOptions } = data;
  if (!videos || videos.length === 0) {
    return "No videos found matching the specified criteria.";
  }

  let output = "📹 Channel Videos:\n\n";
  
  // Add filter information if provided
  if (filterOptions && (filterOptions.query || filterOptions.startDate || filterOptions.endDate)) {
    output += "🔍 Filters Applied:\n";
    if (filterOptions.query) output += `  • Search Query: "${filterOptions.query}"\n`;
    if (filterOptions.startDate) output += `  • Start Date: ${filterOptions.startDate}\n`;
    if (filterOptions.endDate) output += `  • End Date: ${filterOptions.endDate}\n`;
    output += "\n";
  }
  
  output += `Found ${videos.length} videos:\n\n`;
  
  videos.forEach((video: any, index: number) => {
    output += `${index + 1}. 📺 ${video.snippet?.title || 'Untitled'}\n`;
    output += `   🆔 Video ID: ${video.id?.videoId || video.videoId || 'N/A'}\n`;
    
    if (video.snippet?.publishedAt) {
      output += `   📅 Published: ${new Date(video.snippet.publishedAt).toLocaleDateString()}\n`;
    }
    
    if (video.snippet?.description) {
      const desc = video.snippet.description.trim();
      if (desc) {
        output += `   📝 Description: ${desc.slice(0, 100)}${desc.length > 100 ? '...' : ''}\n`;
      }
    }
    
    output += "\n";
  });

  output += "💡 Use the video IDs above with other tools like get_video_demographics for detailed analysis.";
  
  return output;
}

export function generateChannelInsights(channelInfo: ChannelInfo): string[] {
  const insights: string[] = [];
  
  if (!channelInfo.statistics) return insights;
  
  const stats = channelInfo.statistics;
  const subscriberCount = parseInt(stats.subscriberCount || '0');
  const viewCount = parseInt(stats.viewCount || '0');
  const videoCount = parseInt(stats.videoCount || '0');
  
  // Subscriber milestones
  if (subscriberCount >= 1000000) {
    insights.push("🏆 Milestone: Over 1 million subscribers!");
  } else if (subscriberCount >= 100000) {
    insights.push("🎯 Strong channel: Over 100K subscribers");
  } else if (subscriberCount >= 10000) {
    insights.push("📈 Growing channel: Over 10K subscribers");
  } else if (subscriberCount >= 1000) {
    insights.push("🌱 Emerging channel: Over 1K subscribers");
  }
  
  // View-to-subscriber ratio
  if (subscriberCount > 0) {
    const viewToSubRatio = viewCount / subscriberCount;
    if (viewToSubRatio > 100) {
      insights.push("🔥 High engagement: Excellent view-to-subscriber ratio");
    } else if (viewToSubRatio > 50) {
      insights.push("✅ Good engagement: Strong view-to-subscriber ratio");
    } else if (viewToSubRatio < 20) {
      insights.push("📊 Low engagement: Consider improving content strategy");
    }
  }
  
  // Content volume insights
  if (videoCount > 500) {
    insights.push("📹 Prolific creator: Extensive content library");
  } else if (videoCount > 100) {
    insights.push("🎬 Active creator: Solid content library");
  } else if (videoCount < 10) {
    insights.push("🆕 New channel: Building content library");
  }
  
  // Average views per video
  if (videoCount > 0) {
    const avgViewsPerVideo = viewCount / videoCount;
    if (avgViewsPerVideo > 100000) {
      insights.push("⭐ High-performing content: Excellent average views per video");
    } else if (avgViewsPerVideo > 10000) {
      insights.push("👍 Solid content: Good average views per video");
    }
  }
  
  return insights;
}