// lib/duckDuckGoSearch.ts

import { Tool, ToolParams } from "@langchain/core/tools";
import { search, SearchOptions } from "duck-duck-scrape";
export { SafeSearchType, SearchTimeType } from "duck-duck-scrape";

export interface DuckDuckGoSearchParameters extends ToolParams {
  searchOptions?: SearchOptions;
  maxResults?: number;
}

const DEFAULT_MAX_RESULTS = 10;

export class DuckDuckGoSearch extends Tool {
  private searchOptions?: SearchOptions;
  private maxResults = DEFAULT_MAX_RESULTS;

  constructor(params?: DuckDuckGoSearchParameters) {
    super(params ?? {});
    const { searchOptions, maxResults } = params ?? {};
    this.searchOptions = searchOptions;
    this.maxResults = maxResults || this.maxResults;
  }

  static lc_name() {
    return "DuckDuckGoSearch";
  }

  name = "duckduckgo-search";
  description =
    "A search engine. Useful for when you need to answer questions about current events. Input should be a search query.";

  async _call(input: string): Promise<string> {
    const { results } = await search(input, this.searchOptions);
    return JSON.stringify(
      results
        .map((result) => ({
          title: result.title,
          link: result.url,
          snippet: result.description,
        }))
        .slice(0, this.maxResults)
    );
  }
}
