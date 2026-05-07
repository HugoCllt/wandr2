import { z } from 'zod';

import {
  ActivityCategories,
  ActivityKinds,
  type ActivityCategory,
  type ActivityKind,
} from '../../activities/domain/Activity';

export const DatePresets = ['today', 'weekend'] as const;
export type DatePreset = (typeof DatePresets)[number];

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const IsoDateSchema = z.string().regex(ISO_DATE_PATTERN, 'Date must be ISO YYYY-MM-DD.');

const DateRangeSchema = z
  .object({
    from: IsoDateSchema,
    to: IsoDateSchema,
  })
  .refine((range) => range.to >= range.from, {
    message: 'Date range "to" must be on or after "from".',
  });

const DateFilterSchema = z.union([z.enum(DatePresets), DateRangeSchema]);

export type DateRange = z.infer<typeof DateRangeSchema>;
export type DateFilter = DatePreset | DateRange;

export const FilterValueSchema = z
  .object({
    kind: z.enum(ActivityKinds).optional(),
    neighborhood: z.array(z.string().min(1)).min(1).optional(),
    date: DateFilterSchema.optional(),
    category: z.array(z.enum(ActivityCategories)).min(1).optional(),
    priceMax: z.number().int().min(0).optional(),
    indoor: z.boolean().optional(),
    outdoor: z.boolean().optional(),
    free: z.boolean().optional(),
    paid: z.boolean().optional(),
  })
  .strict();

export type FilterValue = {
  kind?: ActivityKind;
  neighborhood?: string[];
  date?: DateFilter;
  category?: ActivityCategory[];
  priceMax?: number;
  indoor?: boolean;
  outdoor?: boolean;
  free?: boolean;
  paid?: boolean;
};

export function isDateRange(date: DateFilter): date is DateRange {
  return typeof date !== 'string';
}
