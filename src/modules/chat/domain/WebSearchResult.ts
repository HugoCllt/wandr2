/** One web-search hit, normalized across providers. */
export type WebSearchResult = {
  title: string;
  url: string;
  content: string;
  imageUrl: string | null;
};
