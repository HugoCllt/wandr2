import type {
  RawActivityCandidate,
  RawActivityCandidateCreateInput,
} from './RawActivityCandidate';

export interface ICandidateRepository {
  create(input: RawActivityCandidateCreateInput): Promise<RawActivityCandidate>;
  findById(id: string): Promise<RawActivityCandidate | null>;
  markPromoted(id: string, activityId: string): Promise<void>;
  markDuplicate(id: string, activityId: string): Promise<void>;
  markRejected(id: string, reason: string): Promise<void>;
}
