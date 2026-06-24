import type { NeighborhoodFacet } from '../domain/IActivityRepository';
import { prisma } from '../../../shared/db/prisma';
import { ListNeighborhoodsUseCase } from '../application/ListNeighborhoodsUseCase';
import { PrismaActivityRepository } from '../infra/PrismaActivityRepository';

export async function listNeighborhoods(): Promise<NeighborhoodFacet[]> {
  const repo = new PrismaActivityRepository(prisma);
  return new ListNeighborhoodsUseCase(repo).execute();
}
