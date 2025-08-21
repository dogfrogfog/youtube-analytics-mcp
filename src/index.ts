import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { OAuth2Client } from "google-auth-library";
import { createAuth } from 'google-auth-mcp';
import { allTools } from './tool-configs.js';
import { YouTubeClient } from './youtube/youtube-client.js';

const auth = createAuth({
  scopes: [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/yt-analytics.readonly',
    'https://www.googleapis.com/auth/youtubepartner'
  ]
});

const server = new McpServer({
  name: "youtube-analytics-mcp",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
    prompts: {},
  },
});

// Cache for YouTube client
let youtubeClientCache: YouTubeClient | null = null;

// Helper function to get YouTube client
async function getYouTubeClient(): Promise<YouTubeClient> {
  try {
    // Return cached client if available
    if (youtubeClientCache) {
      return youtubeClientCache;
    }

    if (!await auth.getAccessToken()) {
      throw new Error('Not authenticated. Please authenticate first.');
    }

    const client = await auth.getClient();

    youtubeClientCache = new YouTubeClient(client as unknown as OAuth2Client);
    return youtubeClientCache;
  } catch (error) {
    // Clear cache on error
    youtubeClientCache = null;
    throw new Error(`Failed to get YouTube client: ${error}`);
  }
}

// Helper function to clear YouTube client cache
function clearYouTubeClientCache(): void {
  youtubeClientCache = null;
}

// Register all tools
allTools.forEach((toolConfig: any) => {
  console.error(`Registering tool: ${toolConfig.name}`);
  
  server.registerTool(
    toolConfig.name,
    {
      description: toolConfig.description,
      inputSchema: toolConfig.schema?.shape || {},
    },
    async (params: any) => {
      try {
        console.error(`Executing tool: ${toolConfig.name}`);
        return await toolConfig.handler(params, { 
          auth, 
          getYouTubeClient, 
          clearYouTubeClientCache 
        });
      } catch (error) {
        console.error(`Error in tool ${toolConfig.name}:`, error);
        return {
          content: [{
            type: "text",
            text: `Error executing ${toolConfig.name}: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );
});

console.error(`Total tools registered: ${allTools.length}`);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("YouTube Analytics MCP Server running on stdio");
}

process.on('SIGINT', async () => {
  console.error("Shutting down server...");
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error("Shutting down server...");
  process.exit(0);
});

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});