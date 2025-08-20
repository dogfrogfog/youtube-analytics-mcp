import { z } from "zod";
import { ToolConfig, ToolContext } from '../types.js';

export const authToolConfigs: ToolConfig[] = [
  {
    name: "check_auth_status",
    description: "Check if the user is authenticated with YouTube",
    category: "authentication",
    schema: z.object({}),
    handler: async (_, { authManager }: ToolContext) => {
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
    },
  },
  {
    name: "revoke_auth",
    description: "Revoke YouTube authentication and remove stored tokens",
    category: "authentication",
    schema: z.object({}),
    handler: async (_, { authManager, clearYouTubeClientCache }: ToolContext) => {
      try {
        await authManager.revokeToken();
        
        // Clear YouTube client cache
        clearYouTubeClientCache();
        
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
    },
  },
];
