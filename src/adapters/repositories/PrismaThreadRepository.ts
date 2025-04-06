import { Thread } from '../../core/domain/openai/Thread';
import { ThreadRepository } from '../../core/domain/repositories/ThreadRepository';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

/**
 * Implementación del repositorio de threads usando Prisma
 */
export class PrismaThreadRepository implements ThreadRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Busca un thread por su ID
   */
  async findById(id: string): Promise<Thread | null> {
    try {
      const thread = await this.prisma.thread.findUnique({
        where: { id }
      });

      if (!thread) return null;

      return new Thread(
        thread.id,
        thread.userId,
        thread.threadId,
        thread.metadata as Record<string, any> || {}
      );
    } catch (error) {
      logger.error('Error al buscar thread por ID', {
        error: (error as Error).message,
        threadId: id
      });
      return null;
    }
  }

  /**
   * Busca un thread por el ID del usuario
   */
  async findByUserId(userId: string): Promise<Thread | null> {
    try {
      const thread = await this.prisma.thread.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (!thread) return null;

      return new Thread(
        thread.id,
        thread.userId,
        thread.threadId,
        thread.metadata as Record<string, any> || {}
      );
    } catch (error) {
      logger.error('Error al buscar thread por ID de usuario', {
        error: (error as Error).message,
        userId
      });
      return null;
    }
  }

  /**
   * Crea o actualiza un thread
   */
  async save(data: any): Promise<Thread> {
    try {
      const thread = await this.prisma.thread.create({
        data: {
          id: data.id || uuidv4(),
          userId: data.userId,
          threadId: data.threadId,
          metadata: data.metadata || {},
        }
      });

      return new Thread(
        thread.id,
        thread.userId,
        thread.threadId,
        thread.metadata as Record<string, any> || {}
      );
    } catch (error) {
      logger.error('Error al guardar thread', {
        error: (error as Error).message,
        data
      });
      throw error;
    }
  }

  /**
   * Crea un nuevo thread
   */
  async create(thread: Thread): Promise<Thread> {
    try {
      const createdThread = await this.prisma.thread.create({
        data: {
          id: thread.id,
          userId: thread.userId,
          threadId: thread.threadId,
          metadata: thread.metadata || {},
        }
      });

      return new Thread(
        createdThread.id,
        createdThread.userId,
        createdThread.threadId,
        createdThread.metadata as Record<string, any> || {}
      );
    } catch (error) {
      logger.error('Error al crear thread', {
        error: (error as Error).message,
        threadData: { id: thread.id, userId: thread.userId }
      });
      throw error;
    }
  }

  /**
   * Actualiza un thread existente
   */
  async update(thread: Thread): Promise<Thread> {
    const updatedThread = await this.prisma.thread.update({
      where: { id: thread.id },
      data: {
        threadId: thread.threadId,
        metadata: thread.metadata,
      }
    });

    return new Thread(
      updatedThread.id,
      updatedThread.userId,
      updatedThread.threadId,
      updatedThread.metadata as Record<string, any> || {}
    );
  }

  /**
   * Elimina un thread por su ID
   */
  async delete(id: string): Promise<void> {
    await this.prisma.thread.delete({
      where: { id },
    });
  }

  /**
   * Busca o crea un thread para un usuario
   */
  async findOrCreateByUserId(userId: string): Promise<Thread> {
    const existingThread = await this.findByUserId(userId);
    
    if (existingThread) {
      return existingThread;
    }
    
    // Si no existe, crear un nuevo thread
    logger.info('Creando nuevo thread para usuario', { userId });
    
    // El ID del thread de OpenAI se debe generar en otro lugar
    const newThreadData = {
      id: uuidv4(),
      userId,
      threadId: `thread_placeholder_${Date.now()}`, // Placeholder, debe ser reemplazado
      metadata: {}
    };
    
    return this.save(newThreadData);
  }

  /**
   * Encuentra el último thread de un usuario
   */
  async findLatestByUserId(userId: string): Promise<Thread | null> {
    const thread = await this.prisma.thread.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!thread) return null;

    return new Thread(
      thread.id,
      thread.userId,
      thread.threadId,
      thread.metadata as Record<string, any> || {}
    );
  }

  /**
   * Alias para findByUserId para compatibilidad
   */
  async getThreadByUserId(userId: string): Promise<Thread | null> {
    return this.findByUserId(userId);
  }

  /**
   * Alias para create para compatibilidad
   */
  async createThread(thread: Thread): Promise<Thread> {
    return this.create(thread);
  }
} 