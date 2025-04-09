import { PrismaClient } from '@prisma/client';
import { User } from '@core/entities/User';
import { UserRepository } from '@core/repositories/UserRepository';
import { logger } from '../../utils/logger';

/**
 * Implementación del repositorio de usuarios usando Prisma ORM
 */
export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findByPhone(phone: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { phone }
    });
    return user as User | null;
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });
    return user as User | null;
  }

  async create(user: User): Promise<User> {
    const createdUser = await this.prisma.user.create({
      data: {
        phone: user.phone,
        name: user.name,
        email: user.email,
        metadata: user.metadata as any
      }
    });
    return createdUser as User;
  }

  async update(user: User): Promise<User> {
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name,
        email: user.email,
        metadata: user.metadata as any,
        updatedAt: new Date()
      }
    });
    return updatedUser as User;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id }
    });
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
    return this.create(user);
  }

  async updateUserMetadata(userId: string, metadata: any): Promise<User> {
    try {
      // Obtenemos primero el usuario para conservar cualquier metadato existente
      const existingUser = await this.findById(userId);
      
      if (!existingUser) {
        throw new Error(`No se encontró el usuario con ID ${userId}`);
      }
      
      // Combinamos los metadatos existentes con los nuevos
      const combinedMetadata = {
        ...(existingUser.metadata || {}),
        ...metadata
      };
      
      // Actualizamos el usuario con los metadatos combinados
      const updatedUser = await this.update({
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