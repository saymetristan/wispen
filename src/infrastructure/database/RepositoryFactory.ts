import { UserRepository } from '@core/domain/repositories/UserRepository';
import { TransactionRepository } from '../../core/domain/repositories/TransactionRepository';
import { ThreadRepository } from '@core/domain/repositories/ThreadRepository';
import { PrismaUserRepository } from '@adapters/repositories/PrismaUserRepository';
import { PrismaTransactionRepository } from '../../adapters/repositories/PrismaTransactionRepository';
import { PrismaThreadRepository } from '@adapters/repositories/PrismaThreadRepository';
import { PrismaClient } from '@prisma/client';
import { RepositoryFactory as DomainRepositoryFactory } from '@core/domain/factories/RepositoryFactory';

/**
 * Interfaz abstracta para la fábrica de repositorios
 * Utiliza el patrón Abstract Factory para crear repositorios
 */
export interface RepositoryFactory {
  /**
   * Obtiene el repositorio de usuarios
   */
  readonly userRepository: UserRepository;
  
  /**
   * Obtiene el repositorio de threads
   */
  readonly threadRepository: ThreadRepository;
  
  /**
   * Cierra las conexiones a la base de datos
   */
  disconnect(): Promise<void>;
}

/**
 * Implementación de la fábrica de repositorios usando Prisma
 */
export class PrismaRepositoryFactoryImpl implements DomainRepositoryFactory, RepositoryFactory {
  private _userRepository: UserRepository | null = null;
  private _threadRepository: ThreadRepository | null = null;
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || new PrismaClient();
  }

  // Implementación para la interfaz de la infraestructura
  get userRepository(): UserRepository {
    return this.createUserRepository();
  }

  get threadRepository(): ThreadRepository {
    return this.createThreadRepository();
  }

  // Implementación para la interfaz del dominio
  createUserRepository(): UserRepository {
    if (!this._userRepository) {
      this._userRepository = new PrismaUserRepository(this.prisma);
    }
    return this._userRepository;
  }

  createThreadRepository(): ThreadRepository {
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