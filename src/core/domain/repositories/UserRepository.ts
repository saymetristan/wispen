import { User } from '../user/User';

/**
 * Interfaz que define las operaciones del repositorio de usuarios
 * Siguiendo los principios de inversión de dependencia (DIP)
 */
export interface UserRepository {
  /**
   * Obtiene un usuario por su ID
   */
  getUserById(id: string): Promise<User | null>;
  
  /**
   * Obtiene un usuario por su número de teléfono
   */
  getUserByPhoneNumber(phoneNumber: string): Promise<User | null>;
  
  /**
   * Crea un nuevo usuario
   */
  createUser(user: User): Promise<User>;
  
  /**
   * Actualiza un usuario existente
   */
  updateUser(user: User): Promise<User>;
  
  /**
   * Elimina un usuario por su ID
   */
  deleteUser(id: string): Promise<void>;
  
  /**
   * Actualiza los metadatos de un usuario
   */
  updateUserMetadata(userId: string, metadata: any): Promise<User>;
  
  // Otras operaciones específicas
  exists(phone: string): Promise<boolean>;
} 