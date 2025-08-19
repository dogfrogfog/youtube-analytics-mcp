# Config-Driven Tools Architecture PRD

## Overview
Transform the Gmail MCP server from inline tool definitions to a scalable, maintainable config-driven architecture where each tool is defined through a configuration object containing name, description, schema, and handler function.

## Problem Statement
Current implementation has tools defined inline with repetitive patterns, making it hard to:
- Overview all available tools at a glance
- Maintain consistent error handling patterns
- Scale to many tools without cluttering the main file
- Reuse common patterns across tools

## Goals
1. **Maintainability**: Clear separation between tool definitions and implementation
2. **Scalability**: Easy to add new tools without modifying core server logic
3. **Consistency**: Standardized error handling and response formatting
4. **Readability**: Clean, declarative configuration that serves as documentation

## Solution Design

### Tool Configuration Structure
Each tool will be defined by a configuration object containing:

```typescript
interface ToolConfig<T = any> {
  name: string;
  description: string;
  schema: z.ZodSchema<T>;
  handler: (params: T) => Promise<ToolResult>;
  category?: string; // Optional grouping
}
```

### Tool Categories
- **Email Operations**: send_email, search_emails, read_email
- **Account Management**: list_accounts, add_account, remove_account, set_default_account

### Implementation Plan
1. Create types for tool configuration
2. Extract existing tools into config objects
3. Create a tool registration system
4. Refactor index.ts to use config-driven approach
5. Maintain backward compatibility

## Benefits
- **Clean separation**: Tool definitions separate from server setup
- **Type safety**: Full TypeScript support for schemas and handlers  
- **Documentation**: Config serves as living documentation
- **Testing**: Easier to unit test individual tools
- **Extensibility**: Simple to add new tool categories

## MCP Implementation Examples

### Before: Inline Tool Definition (329 lines)
```typescript
#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
// ... more imports

const server = new McpServer({
  name: "gmail-mcp",
  version: "1.0.0",
});

// Helper function repeated for each tool...
async function getGmailClient(account?: string): Promise<GmailClient> {
  // ... implementation
}

// Each tool defined inline with repetitive patterns
server.tool(
  "send_email",
  {
    account: z.string().email().optional().describe("..."),
    to: z.array(z.string().email()).describe("..."),
    subject: z.string().describe("..."),
    // ... more schema
  },
  async ({ account, to, subject, body, cc, bcc }) => {
    try {
      const gmailClient = await getGmailClient(account);
      // ... implementation
      return {
        content: [{ type: "text", text: `Email sent...` }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Repeat similar pattern for 7 more tools...
```

### After: Config-Driven Architecture (26 lines)
```typescript
#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { AccountManager } from "./account-manager.js";
import { allToolConfigs } from "./tool-configs.js";

const server = new McpServer({
  name: "gmail-mcp",
  version: "1.0.0",
});

const accountManager = new AccountManager();

// Register all tools from configuration
allToolConfigs.forEach((toolConfig) => {
  server.tool(
    toolConfig.name,
    toolConfig.schema,
    async (params: any) => {
      return toolConfig.handler(params, { accountManager });
    }
  );
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

### Tool Configuration Example
```typescript
// In tool-configs.ts
export const emailToolConfigs: ToolConfig[] = [
  {
    name: "send_email",
    description: "Send an email from a Gmail account",
    category: "email",
    schema: z.object({
      account: z.string().email().optional()
        .describe("Gmail account to use (defaults to default account)"),
      to: z.array(z.string().email()).describe("Recipient email addresses"),
      subject: z.string().describe("Email subject"),
      body: z.string().describe("Email body content"),
      cc: z.array(z.string().email()).optional(),
      bcc: z.array(z.string().email()).optional(),
    }),
    handler: async ({ account, to, subject, body, cc, bcc }, { accountManager }) => {
      try {
        const gmailClient = await getGmailClient(account, accountManager);
        const messageId = await gmailClient.sendEmail({
          to, subject, body, cc, bcc,
        });
        return {
          content: [{
            type: "text",
            text: `Email sent from ${gmailClient.getAccountEmail()}. ID: ${messageId}`,
          }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    },
  },
  // ... other email tools
];
```

### Adding New Tools - Simple Configuration
```typescript
// Adding a new "draft_email" tool - just add to config array:
{
  name: "draft_email", 
  description: "Create a draft email without sending",
  category: "email",
  schema: z.object({
    account: z.string().email().optional(),
    to: z.array(z.string().email()).describe("Recipients"),
    subject: z.string().describe("Draft subject"),
    body: z.string().describe("Draft content"),
  }),
  handler: async ({ account, to, subject, body }, { accountManager }) => {
    const gmailClient = await getGmailClient(account, accountManager);
    const draftId = await gmailClient.createDraft({ to, subject, body });
    return {
      content: [{ 
        type: "text", 
        text: `Draft created with ID: ${draftId}` 
      }],
    };
  },
}
```

### Server Registration Pattern
```typescript
// Automatic registration from configs - no manual server.tool() calls needed
allToolConfigs.forEach((toolConfig) => {
  server.tool(
    toolConfig.name,           // Tool name from config
    toolConfig.schema,         // Zod schema from config  
    async (params: any) => {   // Handler wrapper
      return toolConfig.handler(params, { accountManager });
    }
  );
});
```

### Complete Workflow Example
```typescript
// 1. Define tool in config
const newTool: ToolConfig = {
  name: "get_labels",
  description: "Get all Gmail labels for an account", 
  category: "email",
  schema: z.object({
    account: z.string().email().optional(),
  }),
  handler: async ({ account }, { accountManager }) => {
    const gmail = await getGmailClient(account, accountManager);
    const labels = await gmail.getLabels();
    return {
      content: [{ type: "text", text: JSON.stringify(labels, null, 2) }],
    };
  },
};

// 2. Add to config array
export const emailToolConfigs: ToolConfig[] = [
  // ... existing tools
  newTool,  // <- Just add here!
];

// 3. Server automatically registers it - no changes to index.ts needed!
```

## Success Criteria
- All existing functionality preserved
- Cleaner, more readable main file (92% line reduction)
- Easy to add new tools via configuration
- Consistent error handling across all tools
- Self-documenting tool definitions with descriptions
