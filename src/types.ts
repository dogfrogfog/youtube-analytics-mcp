// Tool configuration types
export interface ToolResult {
  [key: string]: unknown;
  content: Array<{
    type: "text";
    text: string;
    _meta?: Record<string, unknown>;
  }>;
  isError?: boolean;
  _meta?: Record<string, unknown>;
}

export interface ToolContext {
  auth: any;
  getYouTubeClient: () => Promise<any>;
  clearYouTubeClientCache: () => void;
}

// Formatter function types for separating business logic from API calls
export type FormatterFunction = (data: any) => string;

export interface Formatters {
  [key: string]: FormatterFunction;
}

// Helper function to wrap formatters with error handling
export function safeFormatter(formatterName: string, formatter: FormatterFunction): FormatterFunction {
  return (data: any): string => {
    try {
      return formatter(data);
    } catch (error) {
      console.error(`Error in formatter ${formatterName}:`, error);
      return `Error formatting data for ${formatterName}: ${error instanceof Error ? error.message : String(error)}`;
    }
  };
}

export interface ToolConfig<T = any> {
  name: string;
  description: string;
  schema: any; // Zod schema
  handler: (params: T, context: ToolContext) => Promise<ToolResult>;
  category?: string; // Optional grouping
  formatters?: Formatters; // Optional formatter functions for data presentation
}