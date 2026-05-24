import type { ActivityCategory, ActivityKind } from './Activity';

export const CandidateStatuses = ['PENDING', 'PROMOTED', 'REJECTED', 'DUPLICATE'] as const;
export type CandidateStatus = (typeof CandidateStatuses)[number];

/**
 * The Activity-shaped payload an agent extracted from a Tavily result.
 * Dates are ISO strings because this is persisted as Prisma `Json`.
 */
export type ExtractedActivityPayload = {
  title: string;
  description: string;
  imageUrl: string;
  imageCredit: string | null;
  kind: ActivityKind;
  category: ActivityCategory;
  address: string;
  neighborhood: string | null;
  latitude: number;
  longitude: number;
  dateStart: string | null;
  dateEnd: string | null;
  priceMinCents: number;
  priceMaxCents: number | null;
  externalUrl: string | null;
  indoor: boolean;
  outdoor: boolean;
  tags: string[];
};

export type RawActivityCandidate = {
  id: string;
  cityId: string;
  category: ActivityCategory;
  agentName: string;
  searchQuery: string;
  sourceUrl: string;
  rawExcerpt: string;
  extractedPayload: ExtractedActivityPayload;
  dedupeKey: string;
  status: CandidateStatus;
  promotedActivityId: string | null;
  rejectionReason: string | null;
  createdAt: Date;
};

export type RawActivityCandidateCreateInput = Omit<
  RawActivityCandidate,
  'id' | 'status' | 'promotedActivityId' | 'rejectionReason' | 'createdAt'
>;
