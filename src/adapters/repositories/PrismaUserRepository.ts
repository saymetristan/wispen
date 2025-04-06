import { PrismaClient } from '@prisma/client';
import { User } from '../../core/domain/user/User';
import { UserRepository } from '../../core/domain/repositories/UserRepository';
import { logger } from '../../utils/logger';

/**
 * Implementación del repositorio de usuarios usando Prisma
 */
export class PrismaUserRepository implements UserRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Busca un usuario por su ID
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        phone: user.phone,
        name: user.name || undefined,
        email: user.email || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        metadata: user.metadata as any || {}
      };
    } catch (error) {
      logger.error('Error al buscar usuario por ID', {
        error: (error as Error).message,
        userId: id
      });
      throw new Error(`No se pudo encontrar el usuario con ID ${id}`);
    }
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

      return {
        id: user.id,
        phone: user.phone,
        name: user.name || undefined,
        email: user.email || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        metadata: user.metadata as any || {}
      };
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
    try {
      const createdUser = await this.prisma.user.create({
        data: {
          id: user.id,
          phone: user.phone,
          name: user.name || null,
          email: user.email || null,
          metadata: user.metadata || {}
        }
      });

      return {
        id: createdUser.id,
        phone: createdUser.phone,
        name: createdUser.name || undefined,
        email: createdUser.email || undefined,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt,
        metadata: createdUser.metadata as any || {}
      };
    } catch (error) {
      logger.error('Error al crear usuario', {
        error: (error as Error).message,
        user
      });
      throw new Error('No se pudo crear el usuario');
    }
  }

  /**
   * Actualiza un usuario existente
   */
  async updateUser(user: User): Promise<User> {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          phone: user.phone,
          name: user.name || null,
          email: user.email || null,
          metadata: user.metadata || {}
        }
      });

      return {
        id: updatedUser.id,
        phone: updatedUser.phone,
        name: updatedUser.name || undefined,
        email: updatedUser.email || undefined,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        metadata: updatedUser.metadata as any || {}
      };
    } catch (error) {
      logger.error('Error al actualizar usuario', {
        error: (error as Error).message,
        userId: user.id
      });
      throw new Error(`No se pudo actualizar el usuario con ID ${user.id}`);
    }
  }

  /**
   * Elimina un usuario por su ID
   */
  async deleteUser(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id }
      });
    } catch (error) {
      logger.error('Error al eliminar usuario', {
        error: (error as Error).message,
        userId: id
      });
      throw new Error(`No se pudo eliminar el usuario con ID ${id}`);
    }
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
   * Guarda un usuario (alias para create)
   */
  async save(user: User): Promise<User> {
    return this.createUser(user);
  }

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
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          metadata: combinedMetadata
        }
      });

      return {
        id: updatedUser.id,
        phone: updatedUser.phone,
        name: updatedUser.name || undefined,
        email: updatedUser.email || undefined,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        metadata: updatedUser.metadata as any || {}
      };
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