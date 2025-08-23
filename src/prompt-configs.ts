
export interface PromptConfig {
  name: string;
  title?: string;
  description: string;
  argsSchema?: any;
  handler: (args: any) => Promise<any>;
}

// YouTube Analytics Channel Report Prompt
const channelReportPrompt: PromptConfig = {
  name: "youtube_channel_report",
  title: "YouTube Channel Performance Report",
  description: "Generate a comprehensive performance report for your YouTube channel",
  argsSchema: {
    period: {
      type: "string",
      description: "Time period for the report (7d, 30d, 90d, or custom)"
    },
    start_date: {
      type: "string", 
      description: "Start date for custom period (YYYY-MM-DD)"
    },
    end_date: {
      type: "string",
      description: "End date for custom period (YYYY-MM-DD)"
    }
  },
  handler: async (args: any) => {
    const { period = "30d", start_date, end_date } = args;
    
    // Calculate date range
    let startDate: string;
    let endDate: string;
    
    if (start_date && end_date) {
      startDate = start_date;
      endDate = end_date;
    } else {
      const today = new Date();
      endDate = today.toISOString().split('T')[0];
      
      const daysAgo = period === "7d" ? 7 : period === "90d" ? 90 : 30;
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - daysAgo);
      startDate = pastDate.toISOString().split('T')[0];
    }

    return {
      content: [{
        type: "text",
        text: `Please analyze my YouTube channel performance for the period ${startDate} to ${endDate}. 

I want you to:
1. Get my channel overview metrics (views, watch time, subscribers)
2. Analyze my top performing videos 
3. Review audience demographics and geographic distribution
4. Check traffic sources and engagement patterns
5. Provide actionable insights and recommendations

Use the available YouTube Analytics MCP tools to gather this data and create a comprehensive report with specific metrics, trends, and strategic recommendations for improving channel performance.

Time period: ${period}
Date range: ${startDate} to ${endDate}`
      }]
    };
  }
};

// Video Performance Analysis Prompt
const videoAnalysisPrompt: PromptConfig = {
  name: "youtube_video_analysis",
  title: "YouTube Video Performance Analysis", 
  description: "Analyze the performance of a specific YouTube video",
  argsSchema: {
    video_id: {
      type: "string",
      description: "YouTube video ID to analyze"
    },
    period: {
      type: "string",
      description: "Analysis period (7d, 30d, 90d, or custom)"
    }
  },
  handler: async (args: any) => {
    const { video_id, period = "30d" } = args;
    
    // Calculate date range
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    const daysAgo = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - daysAgo);
    const startDate = pastDate.toISOString().split('T')[0];

    return {
      content: [{
        type: "text",
        text: `Please perform a detailed analysis of YouTube video ${video_id} for the period ${startDate} to ${endDate}.

I want you to:
1. Get basic video metrics (views, engagement, watch time)
2. Analyze audience retention and identify drop-off points
3. Review demographics and traffic sources for this video
4. Check engagement metrics (likes, comments, shares)
5. Compare performance against channel averages
6. Identify what made this video successful or what could be improved

Use the YouTube Analytics MCP tools to gather comprehensive data and provide specific, actionable insights about this video's performance.

Video ID: ${video_id}
Analysis period: ${period} (${startDate} to ${endDate})`
      }]
    };
  }
};

// Content Strategy Prompt
const contentStrategyPrompt: PromptConfig = {
  name: "youtube_content_strategy",
  title: "YouTube Content Strategy Recommendations",
  description: "Get data-driven content strategy recommendations based on your channel performance",
  argsSchema: {
    focus_area: {
      type: "string",
      description: "Area to focus on: audience_growth, engagement, watch_time, or overall"
    }
  },
  handler: async (args: any) => {
    const { focus_area = "overall" } = args;
    
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 90); // 90 day analysis
    const startDate = pastDate.toISOString().split('T')[0];

    return {
      content: [{
        type: "text", 
        text: `Please analyze my YouTube channel data and provide strategic content recommendations focused on ${focus_area}.

I want you to:
1. Analyze my channel's performance trends over the last 90 days
2. Identify my best performing content types and topics
3. Review audience behavior patterns and optimal posting times
4. Examine traffic sources and discovery patterns
5. Analyze competitor benchmarks if possible
6. Provide specific, actionable content strategy recommendations

Focus area: ${focus_area}
Analysis period: ${startDate} to ${endDate}

Use all relevant YouTube Analytics MCP tools to gather comprehensive data and create a strategic action plan for improving my ${focus_area === "overall" ? "overall channel performance" : focus_area}.`
      }]
    };
  }
};

export const allPrompts: PromptConfig[] = [
  channelReportPrompt,
  videoAnalysisPrompt,
  contentStrategyPrompt
];