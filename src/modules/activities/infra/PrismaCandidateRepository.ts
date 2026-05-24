import type { Prisma, PrismaClient, RawActivityCandidate as PrismaCandidateModel } from '@prisma/client';

import type { ICandidateRepository } from '../domain/ICandidateRepository';
import type {
  ExtractedActivityPayload,
  RawActivityCandidate,
  RawActivityCandidateCreateInput,
} from '../domain/RawActivityCandidate';

export class PrismaCandidateRepository implements ICandidateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: RawActivityCandidateCreateInput): Promise<RawActivityCandidate> {
    const candidate = await this.prisma.rawActivityCandidate.create({
      data: {
        cityId: input.cityId,
        category: input.category,
        agentName: input.agentName,
        searchQuery: input.searchQuery,
        sourceUrl: input.sourceUrl,
        rawExcerpt: input.rawExcerpt,
        extractedPayload: input.extractedPayload as unknown as Prisma.InputJsonValue,
        dedupeKey: input.dedupeKey,
      },
    });
    return toCandidate(candidate);
  }

  async findById(id: string): Promise<RawActivityCandidate | null> {
    const candidate = await this.prisma.rawActivityCandidate.findUnique({ where: { id } });
    return candidate ? toCandidate(candidate) : null;
  }

  async markPromoted(id: string, activityId: string): Promise<void> {
    await this.prisma.rawActivityCandidate.update({
      where: { id },
      data: { status: 'PROMOTED', promotedActivityId: activityId },
    });
  }

  async markDuplicate(id: string, activityId: string): Promise<void> {
    await this.prisma.rawActivityCandidate.update({
      where: { id },
      data: { status: 'DUPLICATE', promotedActivityId: activityId },
    });
  }

  async markRejected(id: string, reason: string): Promise<void> {
    await this.prisma.rawActivityCandidate.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: reason },
    });
  }
}

function toCandidate(candidate: PrismaCandidateModel): RawActivityCandidate {
  return {
    id: candidate.id,
    cityId: candidate.cityId,
    category: candidate.category,
    agentName: candidate.agentName,
    searchQuery: candidate.searchQuery,
    sourceUrl: candidate.sourceUrl,
    rawExcerpt: candidate.rawExcerpt,
    extractedPayload: candidate.extractedPayload as unknown as ExtractedActivityPayload,
    dedupeKey: candidate.dedupeKey,
    status: candidate.status,
    promotedActivityId: candidate.promotedActivityId,
    rejectionReason: candidate.rejectionReason,
    createdAt: candidate.createdAt,
  };
}
