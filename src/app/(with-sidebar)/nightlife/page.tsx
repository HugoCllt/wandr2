import { renderCategoryPage } from '../_lib/categoryPage';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function NightlifePage({ searchParams }: { searchParams: SearchParams }) {
  return renderCategoryPage('nightlife', searchParams);
}
