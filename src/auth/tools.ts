import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AuthManager } from './auth-manager.js';

export function registerAuthTools(server: McpServer, authManager: AuthManager, clearYouTubeClientCache: () => void) {
  // Check authentication status
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

  // Revoke authentication
  server.tool(
    "revoke_auth",
    "Revoke YouTube authentication and remove stored tokens",
    {},
    async () => {
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
    }
  );
}