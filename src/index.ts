import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { AuthManager } from './auth/auth-manager.js';
import { YouTubeClient } from './youtube-client.js';
import { AuthenticationError } from './auth/types.js';

// Create server instance
const server = new McpServer({
  name: "yt-analytics-mcp",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
    prompts: {},
  },
});

// Initialize auth manager
const authManager = new AuthManager();

// Cache for YouTube client
let youtubeClientCache: YouTubeClient | null = null;

// Helper function to get YouTube client
async function getYouTubeClient(): Promise<YouTubeClient> {
  try {
    // Return cached client if available
    if (youtubeClientCache) {
      return youtubeClientCache;
    }

    const auth = await authManager.getAuthClient();
    youtubeClientCache = new YouTubeClient(auth);
    return youtubeClientCache;
  } catch (error) {
    // Clear cache on error
    youtubeClientCache = null;
    
    if (error instanceof AuthenticationError) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
    throw new Error(`Failed to get YouTube client: ${error}`);
  }
}

// Add a simple test tool to verify the server is working
server.tool(
  "get_server_info",
  "Get information about the YouTube Analytics MCP server",
  {
    format: z.enum(["json", "text"]).optional().describe("Output format (json or text)")
  },
  async ({ format = "text" }) => {
    const info = {
      name: "YouTube Analytics MCP Server",
      version: "1.0.0",
      status: "running",
      capabilities: ["tools", "resources", "prompts"],
      description: "MCP server for YouTube Analytics data access"
    };

    if (format === "json") {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(info, null, 2)
          }
        ]
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Server: ${info.name}
Version: ${info.version}
Status: ${info.status}
Capabilities: ${info.capabilities.join(", ")}
Description: ${info.description}`
        }
      ]
    };
  }
);

// Add a simple echo tool for testing
server.tool(
  "echo",
  "Echo back the provided message (useful for testing connectivity)",
  {
    message: z.string().describe("Message to echo back"),
    uppercase: z.boolean().optional().describe("Return message in uppercase")
  },
  async ({ message, uppercase = false }) => {
    const result = uppercase ? message.toUpperCase() : message;
    return {
      content: [
        {
          type: "text",
          text: `Echo: ${result}`
        }
      ]
    };
  }
);

// YouTube API Tools

// Get channel information
server.tool(
  "get_channel_info",
  "Get information about the authenticated YouTube channel",
  {},
  async () => {
    try {
      const youtubeClient = await getYouTubeClient();
      const channelInfo = await youtubeClient.getChannelInfo();
      
      return {
        content: [{
          type: "text",
          text: `Channel Information:
Name: ${channelInfo.snippet.title}
ID: ${channelInfo.id}
Subscribers: ${parseInt(channelInfo.statistics.subscriberCount).toLocaleString()}
Total Views: ${parseInt(channelInfo.statistics.viewCount).toLocaleString()}
Video Count: ${parseInt(channelInfo.statistics.videoCount).toLocaleString()}
Published: ${new Date(channelInfo.snippet.publishedAt).toLocaleDateString()}
Description: ${channelInfo.snippet.description.slice(0, 200)}${channelInfo.snippet.description.length > 200 ? '...' : ''}`
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
  }
);

// Search videos
server.tool(
  "search_videos",
  "Search for videos on YouTube",
  {
    query: z.string().describe("Search query"),
    maxResults: z.number().min(1).max(50).optional().describe("Maximum number of results (1-50, default 25)")
  },
  async ({ query, maxResults = 25 }) => {
    try {
      const youtubeClient = await getYouTubeClient();
      const results = await youtubeClient.searchVideos(query, maxResults);
      
      if (results.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No videos found for query: "${query}"`
          }]
        };
      }

      const videoList = results.map((video, index) => 
        `${index + 1}. ${video.snippet.title}
   Channel: ${video.snippet.channelTitle}
   Published: ${new Date(video.snippet.publishedAt).toLocaleDateString()}
   Video ID: ${video.id.videoId}
   Description: ${video.snippet.description.slice(0, 100)}${video.snippet.description.length > 100 ? '...' : ''}`
      ).join('\n\n');

      return {
        content: [{
          type: "text",
          text: `Search Results for "${query}" (${results.length} videos):\n\n${videoList}`
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
  }
);

// Get video details
server.tool(
  "get_video_details",
  "Get detailed information about a specific YouTube video",
  {
    videoId: z.string().describe("YouTube video ID")
  },
  async ({ videoId }) => {
    try {
      const youtubeClient = await getYouTubeClient();
      const video = await youtubeClient.getVideoDetails(videoId);
      
      return {
        content: [{
          type: "text",
          text: `Video Details:
Title: ${video.snippet.title}
Channel: ${video.snippet.channelTitle}
Published: ${new Date(video.snippet.publishedAt).toLocaleDateString()}
Duration: ${video.contentDetails.duration}
Views: ${parseInt(video.statistics.viewCount).toLocaleString()}
Likes: ${parseInt(video.statistics.likeCount).toLocaleString()}
Comments: ${parseInt(video.statistics.commentCount).toLocaleString()}
Definition: ${video.contentDetails.definition}
Category: ${video.snippet.categoryId}
Tags: ${video.snippet.tags?.join(', ') || 'None'}
Description: ${video.snippet.description.slice(0, 300)}${video.snippet.description.length > 300 ? '...' : ''}`
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
  }
);

// Get channel videos
server.tool(
  "get_channel_videos",
  "Get recent videos from the authenticated channel",
  {
    maxResults: z.number().min(1).max(50).optional().describe("Maximum number of videos (1-50, default 25)")
  },
  async ({ maxResults = 25 }) => {
    try {
      const youtubeClient = await getYouTubeClient();
      const videos = await youtubeClient.getChannelVideos(maxResults);
      
      if (videos.length === 0) {
        return {
          content: [{
            type: "text",
            text: "No videos found in your channel"
          }]
        };
      }

      const videoList = videos.map((video, index) => 
        `${index + 1}. ${video.snippet.title}
   Published: ${new Date(video.snippet.publishedAt).toLocaleDateString()}
   Video ID: ${video.id.videoId}
   Description: ${video.snippet.description.slice(0, 100)}${video.snippet.description.length > 100 ? '...' : ''}`
      ).join('\n\n');

      return {
        content: [{
          type: "text",
          text: `Your Recent Videos (${videos.length} videos):\n\n${videoList}`
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
  }
);

// Get channel analytics
server.tool(
  "get_channel_analytics",
  "Get analytics data for the authenticated channel",
  {
    startDate: z.string().describe("Start date (YYYY-MM-DD)"),
    endDate: z.string().describe("End date (YYYY-MM-DD)"),
    metrics: z.array(z.string()).describe("Metrics to retrieve (e.g., views, comments, likes, shares, estimatedMinutesWatched, averageViewDuration)"),
    dimensions: z.array(z.string()).optional().describe("Dimensions for grouping (e.g., day, country, deviceType)"),
    maxResults: z.number().min(1).max(200).optional().describe("Maximum number of results")
  },
  async ({ startDate, endDate, metrics, dimensions, maxResults }) => {
    try {
      const youtubeClient = await getYouTubeClient();
      const analytics = await youtubeClient.getChannelAnalytics({
        startDate,
        endDate,
        metrics,
        dimensions,
        maxResults
      });
      
      return {
        content: [{
          type: "text",
          text: `Channel Analytics (${startDate} to ${endDate}):\n\n${JSON.stringify(analytics, null, 2)}`
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
  }
);

// Get video analytics
server.tool(
  "get_video_analytics",
  "Get analytics data for a specific video",
  {
    videoId: z.string().describe("YouTube video ID"),
    startDate: z.string().describe("Start date (YYYY-MM-DD)"),
    endDate: z.string().describe("End date (YYYY-MM-DD)"),
    metrics: z.array(z.string()).describe("Metrics to retrieve (e.g., views, comments, likes, shares, estimatedMinutesWatched, averageViewDuration)"),
    dimensions: z.array(z.string()).optional().describe("Dimensions for grouping (e.g., day, country, deviceType)"),
    maxResults: z.number().min(1).max(200).optional().describe("Maximum number of results")
  },
  async ({ videoId, startDate, endDate, metrics, dimensions, maxResults }) => {
    try {
      const youtubeClient = await getYouTubeClient();
      const analytics = await youtubeClient.getVideoAnalytics(videoId, {
        startDate,
        endDate,
        metrics,
        dimensions,
        maxResults
      });
      
      return {
        content: [{
          type: "text",
          text: `Video Analytics for ${videoId} (${startDate} to ${endDate}):\n\n${JSON.stringify(analytics, null, 2)}`
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
  }
);

// Authentication management tools
server.tool(
  "check_auth_status",
  "Check if the user is authenticated with YouTube",
  {},
  async () => {
    try {
      const isAuthenticated = await authManager.isAuthenticated();
      
      return {
        content: [{
          type: "text",
          text: `Authentication Status: ${isAuthenticated ? 'Authenticated' : 'Not Authenticated'}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error checking auth status: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

server.tool(
  "revoke_auth",
  "Revoke YouTube authentication and remove stored tokens",
  {},
  async () => {
    try {
      await authManager.revokeToken();
      
      // Clear YouTube client cache
      youtubeClientCache = null;
      
      return {
        content: [{
          type: "text",
          text: "Authentication revoked successfully. You will need to re-authenticate to use YouTube tools."
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error revoking auth: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

// Add error handling for testing
server.tool(
  "test_error",
  "Test error handling by throwing an error (for testing purposes)",
  {
    error_type: z.enum(["validation", "runtime", "custom"]).describe("Type of error to throw")
  },
  async ({ error_type }) => {
    switch (error_type) {
      case "validation":
        throw new Error("Validation error: Invalid input provided");
      case "runtime":
        throw new Error("Runtime error: Something went wrong during execution");
      case "custom":
        throw new Error("Custom error: This is a test error for debugging");
      default:
        throw new Error("Unknown error type");
    }
  }
);

// Main server startup function
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("YouTube Analytics MCP Server running on stdio");
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error("Shutting down server...");
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error("Shutting down server...");
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});