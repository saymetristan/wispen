import { UserRepository } from '../../core/domain/repositories/UserRepository';
import { TransactionRepository } from '../../core/domain/repositories/TransactionRepository';
import { PrismaUserRepository } from '../../adapters/repositories/PrismaUserRepository';
import { PrismaTransactionRepository } from '../../adapters/repositories/PrismaTransactionRepository';

/**
 * Factory para crear instancias de repositorios
 * Implementa el principio de inversión de dependencias permitiendo
 * inyectar implementaciones concretas de los repositorios
 */
export class RepositoryFactory {
  private static userRepository: UserRepository | null = null;
  private static transactionRepository: TransactionRepository | null = null;

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
} 