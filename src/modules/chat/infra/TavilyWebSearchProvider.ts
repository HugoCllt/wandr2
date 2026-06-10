import type { IWebSearchProvider } from '../domain/IWebSearchProvider';
import type { WebSearchResult } from '../domain/WebSearchResult';

const TAVILY_URL = 'https://api.tavily.com/search';
const MAX_RESULTS = 5;
const TIMEOUT_MS = 8000;
const ATTEMPTS = 2;

type TavilyResponse = {
  results?: { title?: string; url?: string; content?: string }[];
  images?: string[];
};

/**
 * Web search via Tavily's REST endpoint (`fetch`, no SDK). `include_images`
 * yields page-level images, aligned to results by index — the synthesis step
 * uses the first valid one. Each attempt is bounded by `TIMEOUT_MS` (a hanging
 * Tavily must not stall the whole turn) with one retry; throws when the key is
 * missing or both attempts fail, so the search node can degrade the axis to no
 * results.
 */
export class TavilyWebSearchProvider implements IWebSearchProvider {
  constructor(private readonly apiKey: string) {}

  async search(query: string): Promise<WebSearchResult[]> {
    if (!this.apiKey) throw new Error('TAVILY_API_KEY is not set.');

    let lastError: unknown = null;
    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
      try {
        return await this.searchOnce(query);
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Tavily search failed.');
  }

  private async searchOnce(query: string): Promise<WebSearchResult[]> {
    const res = await fetch(TAVILY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: this.apiKey,
        query,
        include_images: true,
        max_results: MAX_RESULTS,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      throw new Error(`Tavily search failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as TavilyResponse;
    const images = data.images ?? [];
    return (data.results ?? []).map((r, i) => ({
      title: r.title ?? '',
      url: r.url ?? '',
      content: r.content ?? '',
      imageUrl: images[i] ?? null,
    }));
  }
}
