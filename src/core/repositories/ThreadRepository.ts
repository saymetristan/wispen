import { Thread } from '@core/entities/Thread';

/**
 * Interfaz para el repositorio de hilos de conversación
 */
export interface ThreadRepository {
  /**
   * Busca un hilo por su ID
   * @param id ID del hilo
   */
  findById(id: string): Promise<Thread | null>;
  
  /**
   * Busca hilos por el ID de usuario
   * @param userId ID del usuario
   */
  findByUserId(userId: string): Promise<Thread[]>;
  
  /**
   * Crea un nuevo hilo de conversación
   * @param thread Datos del hilo a crear
   */
  create(thread: Thread): Promise<Thread>;
  
  /**
   * Actualiza un hilo de conversación existente
   * @param thread Hilo con los datos actualizados
   */
  update(thread: Thread): Promise<Thread>;
  
  /**
   * Elimina un hilo de conversación
   * @param id ID del hilo a eliminar
   */
  delete(id: string): Promise<void>;
}