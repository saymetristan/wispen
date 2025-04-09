import { PrismaClient } from '@prisma/client';
import { User } from '@core/domain/user/User';
import { UserRepository } from '@core/domain/repositories/UserRepository';
import { logger } from '../../utils/logger';

/**
 * Implementación del repositorio de usuarios usando Prisma ORM
 */
export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Busca un usuario por su número de teléfono (alias para getUserByPhoneNumber)
   */
  async findByPhone(phone: string): Promise<User | null> {
    return this.getUserByPhoneNumber(phone);
  }

  /**
   * Busca un usuario por su ID (alias para getUserById)
   */
  async findById(id: string): Promise<User | null> {
    return this.getUserById(id);
  }

  /**
   * Crea un nuevo usuario (alias para createUser)
   */
  async create(user: User): Promise<User> {
    return this.createUser(user);
  }

  /**
   * Actualiza un usuario existente (alias para updateUser)
   */
  async update(user: User): Promise<User> {
    return this.updateUser(user);
  }

  /**
   * Elimina un usuario (alias para deleteUser)
   */
  async delete(id: string): Promise<void> {
    return this.deleteUser(id);
  }

  /**
   * Busca un usuario por su ID
   */
  async getUserById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });
    return user as User | null;
  }

  /**
   * Busca un usuario por su número de teléfono
   */
  async getUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
    try {
      // Limpiamos el número de teléfono para la búsqueda
      const cleanedPhoneNumber = phoneNumber.replace('whatsapp:', '');
      
      const user = await this.prisma.user.findFirst({
        where: { 
          phone: {
            contains: cleanedPhoneNumber
          }
        }
      });

      if (!user) {
        return null;
      }

      return user as User;
    } catch (error) {
      logger.error('Error al buscar usuario por número de teléfono', {
        error: (error as Error).message,
        phoneNumber
      });
      throw new Error(`No se pudo encontrar el usuario con número de teléfono ${phoneNumber}`);
    }
  }

  /**
   * Crea un nuevo usuario
   */
  async createUser(user: User): Promise<User> {
    const createdUser = await this.prisma.user.create({
      data: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        metadata: user.metadata as any
      }
    });
    return createdUser as User;
  }

  /**
   * Actualiza un usuario existente
   */
  async updateUser(user: User): Promise<User> {
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name,
        metadata: user.metadata as any,
        updatedAt: new Date()
      }
    });
    return updatedUser as User;
  }

  /**
   * Elimina un usuario por su ID
   */
  async deleteUser(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id }
    });
  }

  /**
   * Verifica si existe un usuario con el teléfono dado
   */
  async exists(phone: string): Promise<boolean> {
    try {
      const count = await this.prisma.user.count({
        where: { phone },
      });
      return count > 0;
    } catch (error) {
      logger.error('Error al verificar existencia de usuario', {
        error: (error as Error).message,
        phone
      });
      return false;
    }
  }

  /**
   * Actualiza los metadatos de un usuario
   */
  async updateUserMetadata(userId: string, metadata: any): Promise<User> {
    try {
      // Obtenemos primero el usuario para conservar cualquier metadato existente
      const existingUser = await this.getUserById(userId);
      
      if (!existingUser) {
        throw new Error(`No se encontró el usuario con ID ${userId}`);
      }
      
      // Combinamos los metadatos existentes con los nuevos
      const combinedMetadata = {
        ...(existingUser.metadata || {}),
        ...metadata
      };
      
      // Actualizamos el usuario con los metadatos combinados
      const updatedUser = await this.updateUser({
        ...existingUser,
        metadata: combinedMetadata as any
      });

      return updatedUser;
    } catch (error) {
      logger.error('Error al actualizar metadatos del usuario', {
        error: (error as Error).message,
        userId,
        metadata
      });
      throw new Error(`No se pudo actualizar los metadatos del usuario con ID ${userId}`);
    }
  }
} 