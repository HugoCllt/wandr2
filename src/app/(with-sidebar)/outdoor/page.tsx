import { renderCategoryPage } from '../_lib/categoryPage';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function OutdoorPage({ searchParams }: { searchParams: SearchParams }) {
  return renderCategoryPage('outdoor', searchParams);
}
