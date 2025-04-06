import { UserRepository } from '../repositories/UserRepository';
import { ThreadRepository } from '../repositories/ThreadRepository';

/**
 * Fábrica de repositorios que implementa el patrón Abstract Factory
 * Permite crear instancias de repositorios sin acoplar el dominio a implementaciones concretas
 */
export interface RepositoryFactory {
  /**
   * Crea un repositorio de usuarios
   */
  createUserRepository(): UserRepository;
  
  /**
   * Crea un repositorio de threads
   */
  createThreadRepository(): ThreadRepository;
} 