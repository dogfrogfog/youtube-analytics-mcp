import { z } from "zod";
import { ToolConfig, ToolContext } from '../types.js';

export const serverInfoToolConfigs: ToolConfig[] = [
  {
    name: "get_server_info",
    description: "Get information about the YouTube Analytics MCP server",
    category: "server",
    schema: z.object({
      format: z.enum(["json", "text"]).optional().describe("Output format (json or text)")
    }),
    handler: async ({ format = "text" }) => {
      const info = {
        name: "YouTube Analytics MCP Server",
        version: "1.0.0",
        status: "running",
        capabilities: ["tools", "resources", "prompts"],
        description: "MCP server for YouTube Analytics data access with demographics and discovery tools"
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
    },
  },
];
