# YouTube Analytics MCP Server

A Model Context Protocol (MCP) server for YouTube Analytics data access with demographics and discovery tools, built with a scalable config-driven architecture.

## Core Features

- **Channel Analytics**: Get comprehensive channel overview, growth patterns, and vital signs
- **Video Performance**: Analyze individual video metrics, audience retention, and drop-off points
- **Viewer Demographics**: Access age/gender breakdowns and geographic distribution data
- **Discovery Insights**: Understand traffic sources and search terms driving views
- **Engagement Metrics**: Track likes, comments, shares, and viewer interaction patterns
- **Audience Retention**: Identify exact moments where viewers drop off for content optimization
- **Performance Comparison**: Compare metrics between different time periods
- **Public Channel Analysis**: Research competitor channels and trending content

## Core Architecture Principles

This MCP server follows a **config-driven architecture** that provides:

- **Maintainability**: Clear separation between tool definitions and implementation
- **Scalability**: Easy to add new tools without modifying core server logic
- **Consistency**: Standardized error handling and response formatting
- **Readability**: Clean, declarative configuration that serves as documentation

## Setup

### 1. Google API Credentials

To use this YouTube Analytics MCP server, you need to set up Google API credentials:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Analytics API and YouTube Data API v3
4. Go to "Credentials" and create a new OAuth 2.0 Client ID
5. Download the credentials as JSON
6. Save the file as `credentials.json` in the `src/auth/` directory

**Privacy Note**: All data processing happens locally on your computer. Your credentials and analytics data never leave your machine - the server runs entirely locally and connects directly to Google's APIs from your system.

### 2. Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Inspect with MCP Inspector
npm run inspect
```

## Architecture Overview

## Project Structure

```
src/
├── index.ts                 # Main server entry point (config-driven)
├── tool-configs.ts         # Central tool configuration aggregator
├── types.ts                # TypeScript interfaces and types
├── auth/
│   ├── tool-configs.ts     # Authentication tool configurations
│   └── ...
├── server/
│   ├── info-configs.ts     # Server info tool configurations
│   └── ...
└── youtube/tools/
    ├── channel-configs.ts  # Channel analysis tool configurations
    ├── health-configs.ts   # Channel health tool configurations
    ├── audience-configs.ts # Audience demographics tool configurations
    ├── discovery-configs.ts # Traffic source tool configurations
    ├── performance-configs.ts # Performance analysis tool configurations
    └── engagement-configs.ts # Engagement metrics tool configurations
```

## Tool Configuration Structure

Each tool is defined by a configuration object:

```typescript
interface ToolConfig<T = any> {
  name: string;           // Tool name
  description: string;    // Tool description
  schema: any;           // Zod schema for validation
  handler: (params: T, context: ToolContext) => Promise<ToolResult>;
  category?: string;      // Optional grouping
}
```

## Available Tools

### Authentication Tools
- `check_auth_status` - Check YouTube authentication status
- `revoke_auth` - Revoke authentication and clear tokens

### Channel Tools
- `get_channel_info` - Get basic channel information
- `get_channel_videos` - Get list of channel videos with filters

### Health Tools
- `get_channel_overview` - Get channel vital signs and growth patterns
- `get_comparison_metrics` - Compare metrics between time periods
- `get_average_view_percentage` - Get average view percentage

### Audience Tools
- `get_video_demographics` - Get age/gender breakdown
- `get_geographic_distribution` - Get viewer geographic distribution
- `get_subscriber_analytics` - Get subscriber vs non-subscriber analytics

### Discovery Tools
- `get_traffic_sources` - Get traffic source analysis
- `get_search_terms` - Get search terms for SEO insights

### Performance Tools
- `get_audience_retention` - Track viewer retention patterns
- `get_retention_dropoff_points` - Find exact drop-off moments

### Engagement Tools
- `get_engagement_metrics` - Analyze likes, comments, and shares

## Adding New Tools

To add a new tool, simply create a configuration object and add it to the appropriate config file:

```typescript
// In src/youtube/tools/new-category-configs.ts
export const newCategoryToolConfigs: ToolConfig[] = [
  {
    name: "new_tool_name",
    description: "Description of what the tool does",
    category: "new_category",
    schema: z.object({
      // Define your parameters here
      param1: z.string().describe("Description of parameter 1"),
      param2: z.number().optional().describe("Optional parameter 2"),
    }),
    handler: async ({ param1, param2 }, { getYouTubeClient }: ToolContext) => {
      try {
        const youtubeClient = await getYouTubeClient();
        // Your tool implementation here
        
        return {
          content: [{
            type: "text",
            text: "Tool result here"
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
    },
  },
];

// Then add to src/tool-configs.ts
export const allToolConfigs = [
  // ... existing configs
  ...newCategoryToolConfigs,
];
```

## Benefits of Config-Driven Architecture

1. **Clean Separation**: Tool definitions are separate from server setup
2. **Type Safety**: Full TypeScript support for schemas and handlers
3. **Documentation**: Config serves as living documentation
4. **Testing**: Easier to unit test individual tools
5. **Extensibility**: Simple to add new tool categories
6. **Maintainability**: Consistent patterns across all tools
7. **Scalability**: Easy to manage many tools without cluttering main file

## Server Registration Pattern

The server automatically registers all tools from configuration:

```typescript
// Automatic registration from configs - no manual server.tool() calls needed
allToolConfigs.forEach((toolConfig) => {
  server.tool(
    toolConfig.name,           // Tool name from config
    toolConfig.description,    // Description from config
    toolConfig.schema,         // Zod schema from config  
    async (params: any) => {   // Handler wrapper
      return toolConfig.handler(params, { 
        authManager, 
        getYouTubeClient, 
        clearYouTubeClientCache 
      });
    }
  );
});
```

## Error Handling

All tools follow a consistent error handling pattern:

```typescript
try {
  // Tool implementation
  return {
    content: [{ type: "text", text: "Success result" }]
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
```

## Context Injection

Tools receive a context object with shared dependencies:

```typescript
interface ToolContext {
  authManager: AuthManager;
  getYouTubeClient: () => Promise<YouTubeClient>;
  clearYouTubeClientCache: () => void;
}
```

This architecture makes the codebase more maintainable, scalable, and easier to extend while preserving all existing functionality.
