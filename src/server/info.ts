import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerServerInfoTools(server: McpServer) {
  // Server information tool
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
}