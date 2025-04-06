import { User } from '../../core/domain/User';
import { UserRepository } from '../../core/domain/repositories/UserRepository';
import prisma from '../../infrastructure/database/prisma';
import { v4 as uuidv4 } from 'uuid';

/**
 * Implementación del repositorio de usuarios usando Prisma
 */
export class PrismaUserRepository implements UserRepository {
  /**
   * Busca un usuario por su ID
   */
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    return new User(
      user.id,
      user.phone,
      user.name || null,
      user.createdAt,
      user.updatedAt
    );
  }

  /**
   * Busca un usuario por su número de teléfono
   */
  async findByPhone(phone: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) return null;

    return new User(
      user.id,
      user.phone,
      user.name || null,
      user.createdAt,
      user.updatedAt
    );
  }

  /**
   * Crea un nuevo usuario
   */
  async create(user: User): Promise<User> {
    // Si no viene con ID, generamos uno
    const id = user.id || uuidv4();
    
    const createdUser = await prisma.user.create({
      data: {
        id,
        phone: user.phone,
        name: user.name,
      },
    });

    return new User(
      createdUser.id,
      createdUser.phone,
      createdUser.name || null,
      createdUser.createdAt,
      createdUser.updatedAt
    );
  }

  /**
   * Actualiza un usuario existente
   */
  async update(user: User): Promise<User> {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name,
      },
    });

    return new User(
      updatedUser.id,
      updatedUser.phone,
      updatedUser.name || null,
      updatedUser.createdAt,
      updatedUser.updatedAt
    );
  }

  /**
   * Elimina un usuario por su ID
   */
  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Verifica si existe un usuario con el teléfono dado
   */
  async exists(phone: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { phone },
    });
    return count > 0;
  }

  /**
   * Guarda un usuario (alias para create)
   */
  async save(user: User): Promise<User> {
    return this.create(user);
  }
} 