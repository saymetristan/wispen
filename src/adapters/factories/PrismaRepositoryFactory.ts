import { PrismaClient } from '@prisma/client';
import { RepositoryFactory } from '../../core/domain/factories/RepositoryFactory';
import { UserRepository } from '../../core/domain/repositories/UserRepository';
import { ThreadRepository } from '../../core/domain/repositories/ThreadRepository';
import { PrismaUserRepository } from '../repositories/PrismaUserRepository';
import { PrismaThreadRepository } from '../repositories/PrismaThreadRepository';

/**
 * Implementación de RepositoryFactory utilizando Prisma como ORM
 */
export class PrismaRepositoryFactory implements RepositoryFactory {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Crea un repositorio de usuarios con Prisma
   */
  createUserRepository(): UserRepository {
    return new PrismaUserRepository(this.prisma);
  }

  /**
   * Crea un repositorio de threads con Prisma
   */
  createThreadRepository(): ThreadRepository {
    return new PrismaThreadRepository(this.prisma);
  }
} 