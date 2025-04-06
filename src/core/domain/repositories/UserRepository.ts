import { User } from '../User';

/**
 * Interfaz que define las operaciones del repositorio de usuarios
 * Siguiendo los principios de inversión de dependencia (DIP)
 */
export interface UserRepository {
  // Operaciones CRUD básicas
  findById(id: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  create(user: User): Promise<User>;
  save(user: User): Promise<User>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  
  // Otras operaciones específicas
  exists(phone: string): Promise<boolean>;
} 