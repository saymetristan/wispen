import { Thread } from '../openai/Thread';

/**
 * Interfaz que define las operaciones del repositorio de Threads
 * Siguiendo los principios de inversión de dependencia (DIP)
 */
export interface ThreadRepository {
  // Operaciones CRUD básicas
  findById(id: string): Promise<Thread | null>;
  findByUserId(userId: string): Promise<Thread[]>;
  create(thread: Thread): Promise<Thread>;
  update(thread: Thread): Promise<Thread>;
  delete(id: string): Promise<void>;
  
  // Operaciones específicas
  findOrCreateByUserId(userId: string): Promise<Thread>;
  findLatestByUserId(userId: string): Promise<Thread | null>;
} 