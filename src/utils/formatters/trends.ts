import { VideoInfo } from '../../youtube/types.js';

export function formatTrendingVideos(data: {
  videos: VideoInfo[];
  regionCode?: string;
  categoryId?: string;
}): string {
  const { videos, regionCode, categoryId } = data;
  
  if (!videos || videos.length === 0) {
    return "No trending videos found.";
  }

  let output = `# 📈 Trending Videos`;
  
  if (regionCode) {
    output += ` (${regionCode.toUpperCase()})`;
  } else {
    output += ` (Global)`;
  }
  
  if (categoryId) {
    output += ` - Category ${categoryId}`;
  }
  
  output += `\n\nFound ${videos.length} trending videos:\n\n`;

  videos.forEach((video, index) => {
    const views = parseInt(video.statistics.viewCount).toLocaleString();
    const likes = parseInt(video.statistics.likeCount || '0').toLocaleString();
    const comments = parseInt(video.statistics.commentCount || '0').toLocaleString();
    const duration = formatDuration(video.contentDetails.duration);
    const publishedDate = new Date(video.snippet.publishedAt).toLocaleDateString();
    
    output += `## ${index + 1}. ${video.snippet.title}\n`;
    output += `**Channel:** ${video.snippet.channelTitle}\n`;
    output += `**Views:** ${views} | **Likes:** ${likes} | **Comments:** ${comments}\n`;
    output += `**Duration:** ${duration} | **Published:** ${publishedDate}\n`;
    output += `**Video ID:** ${video.id}\n`;
    output += `**Channel ID:** ${video.snippet.channelId}\n`;
    
    if (video.snippet.tags && video.snippet.tags.length > 0) {
      output += `**Tags:** ${video.snippet.tags.slice(0, 5).join(', ')}${video.snippet.tags.length > 5 ? '...' : ''}\n`;
    }
    
    output += `\n`;
  });

  // Add summary statistics
  const totalViews = videos.reduce((sum, video) => sum + parseInt(video.statistics.viewCount), 0);
  const avgViews = Math.round(totalViews / videos.length);
  const totalLikes = videos.reduce((sum, video) => sum + parseInt(video.statistics.likeCount || '0'), 0);
  const avgLikes = Math.round(totalLikes / videos.length);

  output += `## Summary Statistics\n`;
  output += `- **Total Views:** ${totalViews.toLocaleString()}\n`;
  output += `- **Average Views per Video:** ${avgViews.toLocaleString()}\n`;
  output += `- **Total Likes:** ${totalLikes.toLocaleString()}\n`;
  output += `- **Average Likes per Video:** ${avgLikes.toLocaleString()}\n`;

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