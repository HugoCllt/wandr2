import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import type { IWebSearchProvider } from '../../domain/IWebSearchProvider';
import type { ChatCustomEvent, ChatStateType } from '../chatState';

/**
 * Runs all axis queries in parallel. A failing axis (provider error, missing
 * key) degrades to no results for that axis rather than failing the turn — the
 * downstream nodes handle the empty case honestly.
 */
export function makeSearchNode(webSearch: IWebSearchProvider) {
  return async (
    state: ChatStateType,
    config: LangGraphRunnableConfig,
  ): Promise<Partial<ChatStateType>> => {
    config.writer?.({ kind: 'phase', phase: 'searching' } satisfies ChatCustomEvent);
    const searchResults = await Promise.all(
      state.axes.map((axis) => webSearch.search(axis.query).catch(() => [])),
    );
    return { searchResults };
  };
}
