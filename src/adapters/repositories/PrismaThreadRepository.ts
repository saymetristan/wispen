import { Thread } from '../../core/domain/openai/Thread';
import { ThreadRepository } from '../../core/domain/repositories/ThreadRepository';
import prisma from '../../infrastructure/database/prisma';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@utils/logger';
import { OpenAIAssistantService } from '@infrastructure/services/openai/OpenAIAssistantService';

/**
 * Implementación del repositorio de threads usando Prisma
 */
export class PrismaThreadRepository implements ThreadRepository {
  private openaiAssistantService: OpenAIAssistantService;

  constructor() {
    this.openaiAssistantService = new OpenAIAssistantService();
  }

  /**
   * Busca un thread por su ID
   */
  async findById(id: string): Promise<Thread | null> {
    const thread = await prisma.thread.findUnique({
      where: { id },
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

  /**
   * Busca threads por ID de usuario
   */
  async findByUserId(userId: string): Promise<Thread[]> {
    const threads = await prisma.thread.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return threads.map(
      (thread) =>
        new Thread(
          thread.id,
          thread.userId,
          thread.metadata ? JSON.parse(JSON.stringify(thread.metadata)) : {},
          thread.createdAt,
          thread.updatedAt
        )
    );
  }

  /**
   * Crea un nuevo thread
   */
  async create(thread: Thread): Promise<Thread> {
    const createdThread = await prisma.thread.create({
      data: {
        id: thread.id,
        userId: thread.userId,
        metadata: thread.metadata,
      },
    });

    return new Thread(
      createdThread.id,
      createdThread.userId,
      createdThread.metadata ? JSON.parse(JSON.stringify(createdThread.metadata)) : {},
      createdThread.createdAt,
      createdThread.updatedAt
    );
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
   * Encuentra el thread más reciente de un usuario o crea uno nuevo si no existe
   */
  async findOrCreateByUserId(userId: string): Promise<Thread> {
    // Buscar el último thread del usuario
    const latestThread = await this.findLatestByUserId(userId);

    // Si ya existe un thread, lo devolvemos
    if (latestThread) {
      return latestThread;
    }

    // Si no existe, creamos uno nuevo en OpenAI y luego en la BD
    try {
      // Crear thread en OpenAI
      const openaiThread = await this.openaiAssistantService.createThread(userId);
      
      // Guardar en la base de datos
      return await this.create(openaiThread);
    } catch (error) {
      logger.error('Error al crear thread para usuario', {
        error: (error as Error).message,
        userId,
      });
      throw new Error('No se pudo crear un nuevo thread para el usuario');
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