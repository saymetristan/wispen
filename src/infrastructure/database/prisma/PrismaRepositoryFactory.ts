import { PrismaClient } from '@prisma/client';
import { RepositoryFactory as InfraRepositoryFactory } from '@infrastructure/database/RepositoryFactory';
import { RepositoryFactory as DomainRepositoryFactory } from '@core/domain/factories/RepositoryFactory';
import { UserRepository } from '@core/domain/repositories/UserRepository';
import { ThreadRepository } from '@core/domain/repositories/ThreadRepository';
import { TransactionRepository } from '@core/domain/repositories/TransactionRepository';
import { PrismaUserRepository } from '@adapters/repositories/PrismaUserRepository';
import { PrismaThreadRepository } from '@adapters/repositories/PrismaThreadRepository';
import { PrismaTransactionRepository } from '@adapters/repositories/PrismaTransactionRepository';

/**
 * Implementación de fábrica de repositorios usando Prisma ORM
 */
export class PrismaRepositoryFactory implements InfraRepositoryFactory, DomainRepositoryFactory {
  private prisma: PrismaClient;
  private _userRepository: UserRepository | null = null;
  private _threadRepository: ThreadRepository | null = null;
  private _transactionRepository: TransactionRepository | null = null;

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
    return this.createUserRepository();
  }

  /**
   * Obtiene el repositorio de threads de conversación
   */
  get threadRepository(): ThreadRepository {
    return this.createThreadRepository();
  }

  /**
   * Crea un repositorio de usuarios (implementación de DomainRepositoryFactory)
   */
  createUserRepository(): UserRepository {
    if (!this._userRepository) {
      this._userRepository = new PrismaUserRepository(this.prisma);
    }
    return this._userRepository;
  }

  /**
   * Crea un repositorio de threads (implementación de DomainRepositoryFactory)
   */
  createThreadRepository(): ThreadRepository {
    if (!this._threadRepository) {
      this._threadRepository = new PrismaThreadRepository(this.prisma);
    }
    return this._threadRepository;
  }

  /**
   * Crea un repositorio de transacciones (implementación de DomainRepositoryFactory)
   */
  createTransactionRepository(): TransactionRepository {
    if (!this._transactionRepository) {
      this._transactionRepository = new PrismaTransactionRepository(this.prisma);
    }
    return this._transactionRepository;
  }

  /**
   * Cierra la conexión a la base de datos
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
} 