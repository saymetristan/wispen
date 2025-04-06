import { PrismaClient } from '@prisma/client';
import { RepositoryFactory } from '@infrastructure/database/RepositoryFactory';
import { UserRepository } from '@core/repositories/UserRepository';
import { ThreadRepository } from '@core/repositories/ThreadRepository';
import { PrismaUserRepository } from '@adapters/repositories/PrismaUserRepository';
import { PrismaThreadRepository } from '@adapters/repositories/PrismaThreadRepository';

/**
 * Implementación de fábrica de repositorios usando Prisma ORM
 */
export class PrismaRepositoryFactory implements RepositoryFactory {
  private prisma: PrismaClient;
  private _userRepository: UserRepository | null = null;
  private _threadRepository: ThreadRepository | null = null;

  /**
   * Constructor de la fábrica de repositorios
   * @param prismaClient Cliente de Prisma opcional (si no se proporciona, se crea uno nuevo)
   */
  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || new PrismaClient();
  }

  /**
   * Obtiene el repositorio de usuarios
   */
  get userRepository(): UserRepository {
    if (!this._userRepository) {
      this._userRepository = new PrismaUserRepository(this.prisma);
    }
    return this._userRepository;
  }

  /**
   * Obtiene el repositorio de threads de conversación
   */
  get threadRepository(): ThreadRepository {
    if (!this._threadRepository) {
      this._threadRepository = new PrismaThreadRepository(this.prisma);
    }
    return this._threadRepository;
  }

  /**
   * Cierra la conexión a la base de datos
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
} 