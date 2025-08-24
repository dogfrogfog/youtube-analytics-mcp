import { ChannelInfo, VideoInfo } from '../../youtube/types.js';

export function formatPublicChannelInfo(channelInfo: ChannelInfo): string {
  let output = `# 📊 Channel Statistics\n\n`;
  
  output += `## ${channelInfo.snippet.title}\n`;
  output += `**Channel ID:** ${channelInfo.id}\n`;
  
  if (channelInfo.snippet.customUrl) {
    output += `**Custom URL:** @${channelInfo.snippet.customUrl}\n`;
  }
  
  output += `**Created:** ${new Date(channelInfo.snippet.publishedAt).toLocaleDateString()}\n`;
  
  if (channelInfo.snippet.country) {
    output += `**Country:** ${channelInfo.snippet.country}\n`;
  }
  
  output += `\n### 📈 Statistics\n`;
  
  const subscribers = parseInt(channelInfo.statistics.subscriberCount);
  const views = parseInt(channelInfo.statistics.viewCount);
  const videos = parseInt(channelInfo.statistics.videoCount);
  
  output += `- **Subscribers:** ${subscribers.toLocaleString()}\n`;
  output += `- **Total Views:** ${views.toLocaleString()}\n`;
  output += `- **Total Videos:** ${videos.toLocaleString()}\n`;
  
  if (!channelInfo.statistics.hiddenSubscriberCount) {
    const avgViewsPerVideo = Math.round(views / videos);
    const avgViewsPerSub = Math.round(views / subscribers);
    
    output += `\n### 📊 Analytics\n`;
    output += `- **Average Views per Video:** ${avgViewsPerVideo.toLocaleString()}\n`;
    output += `- **Average Views per Subscriber:** ${avgViewsPerSub.toLocaleString()}\n`;
    output += `- **Videos per Year:** ${calculateVideosPerYear(channelInfo.snippet.publishedAt, videos)}\n`;
  }
  
  output += `\n### 📝 Description\n`;
  const description = channelInfo.snippet.description.length > 200 
    ? channelInfo.snippet.description.substring(0, 200) + '...'
    : channelInfo.snippet.description;
  output += description || 'No description available.';
  
  return output;
}

export function formatPublicChannelVideos(data: {
  videos: VideoInfo[];
  channelId: string;
}): string {
  const { videos, channelId } = data;
  
  if (!videos || videos.length === 0) {
    return `No videos found for channel ${channelId}.`;
  }

  const channelTitle = videos[0]?.snippet.channelTitle || 'Unknown Channel';
  
  let output = `# 📹 Recent Videos - ${channelTitle}\n\n`;
  output += `**Channel ID:** ${channelId}\n`;
  output += `**Videos Found:** ${videos.length}\n\n`;

  videos.forEach((video, index) => {
    const views = parseInt(video.statistics.viewCount).toLocaleString();
    const likes = parseInt(video.statistics.likeCount || '0').toLocaleString();
    const comments = parseInt(video.statistics.commentCount || '0').toLocaleString();
    const duration = formatDuration(video.contentDetails.duration);
    const publishedDate = new Date(video.snippet.publishedAt).toLocaleDateString();
    const daysAgo = Math.floor((Date.now() - new Date(video.snippet.publishedAt).getTime()) / (1000 * 60 * 60 * 24));
    
    output += `## ${index + 1}. ${video.snippet.title}\n`;
    output += `**Views:** ${views} | **Likes:** ${likes} | **Comments:** ${comments}\n`;
    output += `**Duration:** ${duration} | **Published:** ${publishedDate} (${daysAgo} days ago)\n`;
    output += `**Video ID:** ${video.id}\n`;
    
    if (video.snippet.tags && video.snippet.tags.length > 0) {
      output += `**Tags:** ${video.snippet.tags.slice(0, 3).join(', ')}${video.snippet.tags.length > 3 ? '...' : ''}\n`;
    }
    
    // Calculate engagement rate
    const engagementRate = ((parseInt(video.statistics.likeCount || '0') + parseInt(video.statistics.commentCount || '0')) / parseInt(video.statistics.viewCount) * 100).toFixed(2);
    output += `**Engagement Rate:** ${engagementRate}%\n`;
    
    output += `\n`;
  });

  // Add performance summary
  const totalViews = videos.reduce((sum, video) => sum + parseInt(video.statistics.viewCount), 0);
  const avgViews = Math.round(totalViews / videos.length);
  const totalLikes = videos.reduce((sum, video) => sum + parseInt(video.statistics.likeCount || '0'), 0);
  const avgLikes = Math.round(totalLikes / videos.length);
  const totalComments = videos.reduce((sum, video) => sum + parseInt(video.statistics.commentCount || '0'), 0);
  const avgComments = Math.round(totalComments / videos.length);

  output += `## 📊 Performance Summary\n`;
  output += `- **Total Views:** ${totalViews.toLocaleString()}\n`;
  output += `- **Average Views:** ${avgViews.toLocaleString()}\n`;
  output += `- **Average Likes:** ${avgLikes.toLocaleString()}\n`;
  output += `- **Average Comments:** ${avgComments.toLocaleString()}\n`;
  
  // Find best performing video
  const bestVideo = videos.reduce((best, current) => 
    parseInt(current.statistics.viewCount) > parseInt(best.statistics.viewCount) ? current : best
  );
  
  output += `\n### 🏆 Best Performing Video\n`;
  output += `**"${bestVideo.snippet.title}"** - ${parseInt(bestVideo.statistics.viewCount).toLocaleString()} views\n`;

  return output;
}

function formatDuration(duration: string): string {
  // Convert ISO 8601 duration to readable format
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return duration;
  
  const hours = (match[1] || '').replace('H', '');
  const minutes = (match[2] || '').replace('M', '');
  const seconds = (match[3] || '').replace('S', '');
  
  let result = '';
  if (hours) result += `${hours}:`;
  if (minutes) result += `${minutes.padStart(hours ? 2 : 1, '0')}:`;
  result += `${seconds.padStart(2, '0')}`;
  
  return result;
}

function calculateVideosPerYear(createdAt: string, totalVideos: number): number {
  const created = new Date(createdAt);
  const now = new Date();
  const yearsActive = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.round(totalVideos / yearsActive);
}