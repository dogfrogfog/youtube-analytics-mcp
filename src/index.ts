import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from 'zod';
import { AuthManager } from './auth/auth-manager.js';
import { AuthenticationError } from './auth/types.js';
import { allTools } from './tool-configs.js';
import { allPrompts } from './prompt-configs.js';
import { YouTubeClient } from './youtube/youtube-client.js';

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
          authManager, 
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

// Register all prompts
allPrompts.forEach((promptConfig: any) => {
  console.error(`Registering prompt: ${promptConfig.name}`);
  
  server.registerPrompt(
    promptConfig.name,
    {
      title: promptConfig.title,
      description: promptConfig.description,
      argsSchema: promptConfig.argsSchema,
    },
    async (args: any) => {
      try {
        console.error(`Executing prompt: ${promptConfig.name}`);
        return await promptConfig.handler(args);
      } catch (error) {
        console.error(`Error in prompt ${promptConfig.name}:`, error);
        return {
          content: [{
            type: "text",
            text: `Error executing ${promptConfig.name}: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );
});

console.error(`Total prompts registered: ${allPrompts.length}`);

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