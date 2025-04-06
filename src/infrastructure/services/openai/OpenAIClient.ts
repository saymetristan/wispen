import OpenAI from 'openai';
import { env } from '@infrastructure/config/env';
import { logger } from '@utils/logger';

/**
 * Cliente singleton para OpenAI
 */
export class OpenAIClient {
  private static instance: OpenAI | null = null;

  /**
   * Obtiene una instancia del cliente de OpenAI
   */
  static getInstance(): OpenAI {
    if (!this.instance) {
      try {
        this.instance = new OpenAI({
          apiKey: env.OPENAI_API_KEY,
        });
        logger.info('Cliente de OpenAI inicializado correctamente');
      } catch (error) {
        logger.error('Error al inicializar cliente de OpenAI', {
          error: (error as Error).message,
        });
        throw new Error('No se pudo inicializar el cliente de OpenAI');
      }
    }
    return this.instance;
  }

  /**
   * Verifica la conexión con OpenAI
   */
  static async testConnection(): Promise<boolean> {
    try {
      const openai = this.getInstance();
      // Realizar una llamada simple para verificar la conexión
      await openai.models.list();
      logger.info('Conexión a OpenAI establecida correctamente');
      return true;
    } catch (error) {
      logger.error('Error al conectar con OpenAI', {
        error: (error as Error).message,
      });
      return false;
    }
  }
} 