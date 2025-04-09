import { User } from '@core/entities/User';

/**
 * Interfaz para el repositorio de usuarios
 */
export interface UserRepository {
  /**
   * Busca un usuario por su número de teléfono
   * @param phone Número de teléfono del usuario
   */
  findByPhone(phone: string): Promise<User | null>;
  
  /**
   * Busca un usuario por su ID
   * @param id ID del usuario
   */
  findById(id: string): Promise<User | null>;
  
  /**
   * Crea un nuevo usuario
   * @param user Datos del usuario a crear
   */
  create(user: User): Promise<User>;
  
  /**
   * Actualiza los datos de un usuario existente
   * @param user Usuario con los datos actualizados
   */
  update(user: User): Promise<User>;
  
  /**
   * Elimina un usuario
   * @param id ID del usuario a eliminar
   */
  delete(id: string): Promise<void>;
} 