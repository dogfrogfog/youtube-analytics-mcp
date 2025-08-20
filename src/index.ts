import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { AuthManager } from './auth/auth-manager.js';
import { AuthenticationError } from './auth/types.js';
import { YouTubeClient } from './youtube/youtube-client.js';
import { allToolConfigs } from './tool-configs.js';

// Create server instance
const server = new McpServer({
  name: "youtube-analytics-mcp",
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

// Helper function to clear YouTube client cache
function clearYouTubeClientCache(): void {
  youtubeClientCache = null;
}

// Register all tools from configuration using config-driven architecture
allToolConfigs.forEach((toolConfig) => {
  server.tool(
    toolConfig.name,
    toolConfig.description,
    {},
    async (params: any) => {
      return toolConfig.handler(params, { 
        authManager, 
        getYouTubeClient, 
        clearYouTubeClientCache 
      });
    }
  );
});

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