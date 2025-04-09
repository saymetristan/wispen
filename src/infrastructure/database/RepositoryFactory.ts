import { UserRepository } from '@core/repositories/UserRepository';
import { TransactionRepository } from '../../core/domain/repositories/TransactionRepository';
import { ThreadRepository } from '@core/repositories/ThreadRepository';
import { PrismaUserRepository } from '../../adapters/repositories/PrismaUserRepository';
import { PrismaTransactionRepository } from '../../adapters/repositories/PrismaTransactionRepository';
import { PrismaThreadRepository } from '../../adapters/repositories/PrismaThreadRepository';

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
 * Factory para crear instancias de repositorios
 * Implementa el principio de inversión de dependencias permitiendo
 * inyectar implementaciones concretas de los repositorios
 */
export class RepositoryFactoryImpl implements RepositoryFactory {
  private static userRepository: UserRepository | null = null;
  private static transactionRepository: TransactionRepository | null = null;
  private static threadRepository: ThreadRepository | null = null;

  /**
   * Obtiene una instancia del repositorio de usuarios
   */
  static getUserRepository(): UserRepository {
    if (!this.userRepository) {
      this.userRepository = new PrismaUserRepository();
    }
    return this.userRepository;
  }

  /**
   * Obtiene una instancia del repositorio de transacciones
   */
  static getTransactionRepository(): TransactionRepository {
    if (!this.transactionRepository) {
      this.transactionRepository = new PrismaTransactionRepository();
    }
    return this.transactionRepository;
  }

  /**
   * Obtiene una instancia del repositorio de threads
   */
  static getThreadRepository(): ThreadRepository {
    if (!this.threadRepository) {
      this.threadRepository = new PrismaThreadRepository();
    }
    return this.threadRepository;
  }

  /**
   * Método para establecer un repositorio de usuarios de prueba (útil para tests)
   */
  static setUserRepository(repository: UserRepository): void {
    this.userRepository = repository;
  }

  /**
   * Método para establecer un repositorio de transacciones de prueba (útil para tests)
   */
  static setTransactionRepository(repository: TransactionRepository): void {
    this.transactionRepository = repository;
  }

  /**
   * Método para establecer un repositorio de threads de prueba (útil para tests)
   */
  static setThreadRepository(repository: ThreadRepository): void {
    this.threadRepository = repository;
  }

  readonly userRepository: UserRepository;
  readonly threadRepository: ThreadRepository;

  constructor() {
    this.userRepository = RepositoryFactoryImpl.getUserRepository();
    this.threadRepository = RepositoryFactoryImpl.getThreadRepository();
  }

  async disconnect(): Promise<void> {
    // Implementation of disconnect method
  }
} 