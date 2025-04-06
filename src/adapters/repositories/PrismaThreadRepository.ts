import { Thread } from '../../core/domain/openai/Thread';
import { ThreadRepository } from '../../core/domain/repositories/ThreadRepository';
import prisma from '../../infrastructure/database/prisma';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@utils/logger';

/**
 * Implementación del repositorio de threads usando Prisma
 */
export class PrismaThreadRepository implements ThreadRepository {
  constructor() {
    // No debe tener dependencia con OpenAIAssistantService
  }

  /**
   * Busca un thread por su ID
   */
  async findById(id: string): Promise<Thread | null> {
    try {
      const thread = await prisma.thread.findUnique({
        where: { id },
      });

      if (!thread) return null;

      return new Thread(
        thread.id,
        thread.userId,
        thread.metadata ? (thread.metadata as Record<string, string>) : {},
        thread.createdAt,
        thread.updatedAt
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
   * Busca threads por ID de usuario
   */
  async findByUserId(userId: string): Promise<Thread | null> {
    try {
      const thread = await prisma.thread.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      
      if (!thread) return null;

      return new Thread(
        thread.id,
        thread.userId,
        thread.metadata ? (thread.metadata as Record<string, string>) : {},
        thread.createdAt,
        thread.updatedAt
      );
    } catch (error) {
      logger.error('Error al buscar threads por userId', {
        error: (error as Error).message,
        userId
      });
      return null;
    }
  }

  /**
   * Guarda un thread en la base de datos (útil para cuando se recibe un objeto simple)
   */
  async save(data: any): Promise<Thread> {
    try {
      const thread = await prisma.thread.create({
        data: {
          id: data.id || uuidv4(),
          userId: data.userId,
          metadata: data.metadata || {},
          // Las fechas se asignarán automáticamente en la BD
        },
      });

      return new Thread(
        thread.id,
        thread.userId,
        thread.metadata ? (thread.metadata as Record<string, string>) : {},
        thread.createdAt,
        thread.updatedAt
      );
    } catch (error) {
      logger.error('Error al guardar thread', {
        error: (error as Error).message,
        userId: data.userId
      });
      throw error;
    }
  }

  /**
   * Crea un nuevo thread
   */
  async create(thread: Thread): Promise<Thread> {
    try {
      const createdThread = await prisma.thread.create({
        data: {
          id: thread.id,
          userId: thread.userId,
          metadata: thread.metadata || {},
        },
      });

      return new Thread(
        createdThread.id,
        createdThread.userId,
        createdThread.metadata ? (createdThread.metadata as Record<string, string>) : {},
        createdThread.createdAt,
        createdThread.updatedAt
      );
    } catch (error) {
      logger.error('Error al crear thread', {
        error: (error as Error).message,
        threadId: thread.id,
        userId: thread.userId
      });
      throw error;
    }
  }

  /**
   * Actualiza un thread existente
   */
  async update(thread: Thread): Promise<Thread> {
    const updatedThread = await prisma.thread.update({
      where: { id: thread.id },
      data: {
        metadata: thread.metadata,
      },
    });

    return new Thread(
      updatedThread.id,
      updatedThread.userId,
      updatedThread.metadata ? JSON.parse(JSON.stringify(updatedThread.metadata)) : {},
      updatedThread.createdAt,
      updatedThread.updatedAt
    );
  }

  /**
   * Elimina un thread por su ID
   */
  async delete(id: string): Promise<void> {
    await prisma.thread.delete({
      where: { id },
    });
  }

  /**
   * Encuentra un thread por userId o crea uno nuevo si no existe
   */
  async findOrCreateByUserId(userId: string): Promise<Thread> {
    try {
      // Buscar el thread existente
      const existingThread = await this.findByUserId(userId);
      
      // Si existe, devolverlo
      if (existingThread) {
        return existingThread;
      }
      
      // Si no existe, crear uno nuevo con un ID generado
      const threadId = uuidv4();
      
      // Crear el thread en la base de datos
      const newThread = new Thread(
        threadId,
        userId,
        { created_by: 'local_system' },
        new Date(),
        new Date()
      );
      
      return await this.create(newThread);
    } catch (error) {
      logger.error('Error en findOrCreateByUserId', {
        error: (error as Error).message,
        userId
      });
      throw error;
    }
  }

  /**
   * Busca el thread más reciente para un usuario
   */
  async findLatestByUserId(userId: string): Promise<Thread | null> {
    const thread = await prisma.thread.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!thread) return null;

    return new Thread(
      thread.id,
      thread.userId,
      thread.metadata ? JSON.parse(JSON.stringify(thread.metadata)) : {},
      thread.createdAt,
      thread.updatedAt
    );
  }
} 