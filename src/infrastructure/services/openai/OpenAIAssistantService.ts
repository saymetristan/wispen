import OpenAI from 'openai';
import { OpenAIClient } from './OpenAIClient';
import { Thread } from '@core/domain/openai/Thread';
import { logger } from '@utils/logger';
import { env } from '@infrastructure/config/env';

/**
 * Servicio para interactuar con la API de Assistants de OpenAI
 */
export class OpenAIAssistantService {
  private openai: OpenAI;
  private assistantId: string | null = null;

  constructor() {
    this.openai = OpenAIClient.getInstance();
  }

  /**
   * Obtiene el ID del asistente configurado
   * El asistente ya ha sido creado en la plataforma de OpenAI con ID: asst_x1lJ9EZEPu3vlJVGoKRcgQV1
   * y está configurado en las variables de entorno
   * Solo como fallback, si no existe el ID, crearía uno nuevo
   */
  async getOrCreateAssistant(): Promise<string> {
    if (this.assistantId) {
      return this.assistantId;
    }

    try {
      // Usar el asistente configurado en las variables de entorno (escenario principal)
      if (env.OPENAI_ASSISTANT_ID) {
        // Verificar que el asistente existe
        const assistant = await this.openai.beta.assistants.retrieve(env.OPENAI_ASSISTANT_ID);
        this.assistantId = assistant.id;
        logger.info('Asistente de OpenAI recuperado correctamente', { assistantId: this.assistantId });
        return this.assistantId;
      }

      // NOTA: Este escenario de fallback no debería ocurrir en producción
      // ya que el asistente ya está creado y configurado
      logger.warn('No se encontró ID de asistente en variables de entorno, creando uno nuevo');
      const assistant = await this.openai.beta.assistants.create({
        name: 'Wispen - Asistente Financiero',
        description: 'Asistente financiero personal para WhatsApp',
        instructions: this.getAssistantInstructions(),
        model: 'gpt-4o',
        tools: [{ type: 'code_interpreter' }]
      });

      this.assistantId = assistant.id;
      logger.info('Nuevo asistente de OpenAI creado correctamente', { assistantId: this.assistantId });
      logger.warn('Se recomienda guardar este ID en las variables de entorno: ' + this.assistantId);
      return this.assistantId;
    } catch (error) {
      logger.error('Error al obtener o crear asistente de OpenAI', {
        error: (error as Error).message,
      });
      throw new Error('No se pudo obtener o crear el asistente de OpenAI');
    }
  }

  /**
   * Crea un nuevo hilo de conversación en OpenAI
   */
  async createThread(userId: string): Promise<Thread> {
    try {
      const response = await this.openai.beta.threads.create({
        metadata: {
          userId: userId
        }
      });

      return new Thread(
        response.id,
        userId,
        response.metadata as Record<string, string>,
        new Date(response.created_at * 1000),
        new Date(response.created_at * 1000)
      );
    } catch (error) {
      logger.error('Error al crear thread en OpenAI', {
        error: (error as Error).message,
        userId,
      });
      throw new Error('No se pudo crear el thread en OpenAI');
    }
  }

  /**
   * Envía un mensaje al hilo de conversación
   */
  async addMessageToThread(threadId: string, content: string): Promise<string> {
    try {
      const message = await this.openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: content,
      });

      logger.info('Mensaje añadido al thread correctamente', {
        threadId,
        messageId: message.id,
      });

      return message.id;
    } catch (error) {
      logger.error('Error al añadir mensaje al thread', {
        error: (error as Error).message,
        threadId,
      });
      throw new Error('No se pudo añadir el mensaje al thread');
    }
  }

  /**
   * Ejecuta el asistente en un hilo para obtener una respuesta
   */
  async runAssistant(threadId: string): Promise<string> {
    try {
      const assistantId = await this.getOrCreateAssistant();
      
      // Iniciar la ejecución del asistente
      const run = await this.openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId
      });

      // Esperar a que termine el procesamiento
      let runStatus = await this.waitForRunCompletion(threadId, run.id);
      
      // Si hay un error, lanzar excepción
      if (runStatus.status === 'failed' || runStatus.status === 'cancelled') {
        throw new Error(`La ejecución del asistente falló: ${runStatus.status}`);
      }
      
      // Obtener los mensajes de respuesta del asistente
      const messages = await this.openai.beta.threads.messages.list(threadId, {
        order: 'desc',
        limit: 1,
      });
      
      // Verificar que hay mensajes y fueron generados por el asistente
      const assistantMessages = messages.data.filter(msg => msg.role === 'assistant');
      if (assistantMessages.length === 0) {
        throw new Error('No se encontraron respuestas del asistente');
      }
      
      // Extraer el contenido del mensaje
      const content = assistantMessages[0].content[0];
      if (content.type !== 'text') {
        throw new Error('La respuesta del asistente no es texto');
      }

      return content.text.value;
    } catch (error) {
      logger.error('Error al ejecutar el asistente', {
        error: (error as Error).message,
        threadId,
      });
      throw new Error('Error al procesar la consulta con el asistente');
    }
  }

  /**
   * Espera a que se complete la ejecución del asistente
   */
  private async waitForRunCompletion(threadId: string, runId: string, maxAttempts = 10): Promise<OpenAI.Beta.Threads.Runs.Run> {
    let attempts = 0;
    let run: OpenAI.Beta.Threads.Runs.Run;
    
    while (attempts < maxAttempts) {
      run = await this.openai.beta.threads.runs.retrieve(threadId, runId);
      
      if (run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled') {
        return run;
      }
      
      // Esperar antes de volver a consultar (incrementar tiempo con cada intento)
      const waitTime = Math.min(1000 * (attempts + 1), 10000);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      attempts++;
    }
    
    // Si llegamos aquí, se agotaron los intentos
    throw new Error('Tiempo de espera agotado para la ejecución del asistente');
  }

  /**
   * Instrucciones básicas para el asistente
   */
  private getAssistantInstructions(): string {
    return `
    # Asistente Financiero Wispen

    ## Propósito
    Eres Wispen, un asistente financiero personal diseñado para ayudar a los usuarios a través de WhatsApp a gestionar sus finanzas personales.

    ## Personalidad
    - Amigable y conversacional, sin ser demasiado formal
    - Claro y conciso en tus explicaciones
    - Enfocado en soluciones prácticas
    - Positivo y motivador sobre finanzas personales

    ## Funciones principales
    - Registrar transacciones (gastos e ingresos)
    - Consultar saldo disponible
    - Ofrecer resúmenes de gastos por categoría
    - Responder preguntas sobre conceptos financieros básicos

    ## Reglas importantes
    1. Mantener las respuestas breves y directas, ideal para WhatsApp
    2. Nunca pedir información sensible como contraseñas o datos bancarios
    3. Cuando no entiendas algo, pedir clarificación de forma específica
    4. Asumir siempre la moneda en pesos mexicanos a menos que se especifique otra

    ## Ejemplos de interacciones
    - "Gasté 350 en el supermercado" -> Registrar gasto
    - "Recibí 5000 de sueldo" -> Registrar ingreso
    - "Cuánto dinero tengo?" -> Consultar saldo
    - "En qué he gastado este mes?" -> Resumen de gastos
    `;
  }
} 