import OpenAI from 'openai';
import { logger } from '@utils/logger';

/**
 * Cliente para interactuar con OpenAI
 */
export class OpenAIClient {
  private apiKey: string;
  private client: OpenAI;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new OpenAI({
      apiKey: this.apiKey
    });
  }

  /**
   * Obtiene la instancia del cliente de OpenAI
   */
  getClient(): OpenAI {
    return this.client;
  }

  /**
   * Crea una instancia de OpenAI
   */
  getInstance(): OpenAI {
    return this.client;
  }

  /**
   * Verifica la conexión con OpenAI
   */
  static async testConnection(apiKey: string): Promise<boolean> {
    try {
      const openai = new OpenAI({
        apiKey: apiKey || process.env.OPENAI_API_KEY,
      });
      // Realizar una llamada simple para verificar la conexión
      await openai.models.list();
      logger.info('Conexión a OpenAI establecida correctamente');
      return true;
    } catch (error) {
      logger.error('Error al conectar con OpenAI', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
} 