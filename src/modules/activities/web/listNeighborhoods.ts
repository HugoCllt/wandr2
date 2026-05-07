import { prisma } from '../../../shared/db/prisma';
import { ListNeighborhoodsUseCase } from '../application/ListNeighborhoodsUseCase';
import { PrismaActivityRepository } from '../infra/PrismaActivityRepository';

export async function listNeighborhoods(): Promise<string[]> {
  const repo = new PrismaActivityRepository(prisma);
  return new ListNeighborhoodsUseCase(repo).execute();
}
