import OpenAI from 'openai';
import { logger } from '../../../utils/logger';

/**
 * Cliente para OpenAI
 */
export class OpenAIClient {
  private client: OpenAI;

  constructor() {
    try {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      logger.info('Cliente de OpenAI inicializado correctamente');
    } catch (error) {
      logger.error('Error al inicializar cliente de OpenAI', {
        error: (error as Error).message,
      });
      throw new Error('No se pudo inicializar el cliente de OpenAI');
    }
  }

  /**
   * Obtiene el cliente de OpenAI
   */
  getClient(): OpenAI {
    return this.client;
  }

  /**
   * Verifica la conexión con OpenAI
   */
  static async testConnection(): Promise<boolean> {
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
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