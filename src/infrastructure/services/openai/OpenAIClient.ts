import { logger } from '@utils/logger';

/**
 * Cliente para interactuar con OpenAI
 */
export class OpenAIClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Crea una instancia de OpenAI
   */
  getInstance() {
    try {
      // En una implementación real, aquí se devolvería una instancia del cliente OpenAI
      return { apiKey: this.apiKey };
    } catch (error) {
      logger.error('Error al crear instancia de OpenAI', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('No se pudo crear la instancia de OpenAI');
    }
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