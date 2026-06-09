import type { WebSearchResult } from './WebSearchResult';

/** Port for the web-search the recommendation graph runs, one query per axis. */
export interface IWebSearchProvider {
  search(query: string): Promise<WebSearchResult[]>;
}
