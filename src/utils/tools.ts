import { TavilySearch } from "@langchain/tavily";

// Initialize Tavily Search Tool
export const safeWebSearchTool = new TavilySearch({
  maxResults: 3,
  tavilyApiKey: process.env.TAVILY_API_KEY!
});
