import { notFound } from 'next/navigation';

import { isCategoryKey } from '../../../shared/presets/CATEGORY_PRESETS';
import { renderCategoryPage } from '../_lib/categoryPage';
import type { SearchParamsInput } from '../_lib/searchParams';

export const dynamic = 'force-dynamic';

/**
 * The one and only Category page route. Every entry in `CATEGORY_PRESETS` is
 * served by this file. Adding a category is a one-line registry edit — no new
 * file. See CONTEXT.md "Category page".
 */
export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { category: string };
  searchParams: SearchParamsInput;
}) {
  if (!isCategoryKey(params.category)) notFound();
  return renderCategoryPage(params.category, searchParams);
}
