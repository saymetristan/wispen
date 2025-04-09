import OpenAI from 'openai';
import { OpenAIClient } from './OpenAIClient';
import { logger } from '../../../utils/logger';
import { AsyncLocalStorage } from 'async_hooks';
import { ThreadRepository } from '../../../core/domain/repositories/ThreadRepository';
import { OpenAIToolHandler } from './tools/OpenAIToolHandler';
import { Thread } from '../../../core/domain/openai/Thread';
import { RunStatus } from 'openai/resources/beta/threads/runs/runs';
import { PrismaThreadRepository } from '../../../adapters/repositories/PrismaThreadRepository';
import { PrismaClient } from '@prisma/client';

const asyncLocalStorage = new AsyncLocalStorage<string>();

/**
 * Servicio para interactuar con la API de Assistants de OpenAI
 */
export class OpenAIAssistantService {
  private openai: OpenAI;
  private assistantId: string | null = null;
  private threadRepository: ThreadRepository;
  private toolHandler: OpenAIToolHandler;
  private openAIClient: OpenAIClient;
  private prisma: PrismaClient;

  constructor(
    openAIClient: OpenAIClient,
    assistantId: string | null = null,
    prismaClient: PrismaClient
  ) {
    // Inicializar el cliente de OpenAI
    this.openai = openAIClient.getClient();
    
    // Establecer ID del asistente si se proporciona
    this.assistantId = assistantId;
    
    // Obtener el repositorio de threads mediante inyección
    this.threadRepository = new PrismaThreadRepository(prismaClient);
    
    // Inicializar el manejador de herramientas
    this.toolHandler = new OpenAIToolHandler();

    this.openAIClient = openAIClient;
    this.prisma = prismaClient;
  }

  /**
   * Obtiene el ID del asistente configurado
   * El asistente ya ha sido creado en la plataforma de OpenAI
   * y está configurado en las variables de entorno
   * Solo como fallback, si no existe el ID, crearía uno nuevo
   */
  async getOrCreateAssistant(): Promise<string> {
    if (this.assistantId) {
      return this.assistantId;
    }

    try {
      // Usar el asistente configurado en las variables de entorno (escenario principal)
      if (process.env.OPENAI_ASSISTANT_ID) {
        // Verificar que el asistente existe
        const assistant = await this.openai.beta.assistants.retrieve(process.env.OPENAI_ASSISTANT_ID);
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

  /**
   * Procesa un mensaje del usuario y genera una respuesta del asistente
   */
  async processMessage(userId: string, message: string): Promise<string> {
    try {
      // Buscar o crear el thread para este usuario
      const userThread = await this.findOrCreateThread(userId);
      const threadId = userThread.threadId;

      logger.info('Procesando mensaje de usuario', {
        userId,
        threadId,
        messageLength: message.length
      });

      // Añadir el mensaje al thread
      const createdMessage = await this.openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: message,
      });
      logger.info('Mensaje añadido al thread', {
        messageId: createdMessage.id,
        threadId,
        userId
      });

      // Ejecutar el asistente
      const run = await this.openai.beta.threads.runs.create(threadId, {
        assistant_id: await this.getOrCreateAssistant(),
      });
      logger.info('Ejecución iniciada', { runId: run.id, userId, threadId });

      // Esperar a que termine la ejecución o requiera acción
      let currentRun = run;
      while (
        currentRun.status !== 'completed' &&
        currentRun.status !== 'failed' &&
        currentRun.status !== 'cancelled' &&
        currentRun.status !== 'expired'
      ) {
        // Esperar antes de consultar de nuevo
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Obtener el estado actual
        currentRun = await this.openai.beta.threads.runs.retrieve(threadId, currentRun.id);
        
        // Si requiere acción para herramientas
        if (currentRun.status === 'requires_action') {
          if (currentRun.required_action?.type === 'submit_tool_outputs') {
            const toolCalls = currentRun.required_action.submit_tool_outputs.tool_calls;
            const toolOutputs = [];

            // Procesar cada llamada a herramienta
            for (const toolCall of toolCalls) {
              logger.info('Procesando llamada a herramienta', {
                tool: toolCall.function.name,
                userId
              });

              // Ejecutar la herramienta
              const result = await this.toolHandler.handleToolCall(toolCall, userId);
              
              // Añadir el resultado
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify(result)
              });
            }

            // Enviar los resultados
            currentRun = await this.openai.beta.threads.runs.submitToolOutputs(threadId, currentRun.id, {
              tool_outputs: toolOutputs
            });
          }
        }
        
        logger.debug('Estado de ejecución', {
          runId: currentRun.id,
          status: currentRun.status,
          userId
        });
      }

      // Verificar si la ejecución fue exitosa
      if (currentRun.status !== 'completed') {
        logger.error('Ejecución fallida', {
          runId: currentRun.id,
          status: currentRun.status,
          userId
        });
        return 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo más tarde.';
      }

      // Obtener la respuesta del asistente
      const messages = await this.openai.beta.threads.messages.list(threadId, {
        limit: 1,
        order: 'desc'
      });

      if (messages.data.length === 0) {
        logger.error('No se encontraron mensajes después de la ejecución', {
          runId: currentRun.id,
          userId
        });
        return 'Lo siento, no pude generar una respuesta. Por favor, intenta de nuevo.';
      }

      const assistantMessage = messages.data[0];
      const content = assistantMessage.content[0];

      if (content.type !== 'text') {
        logger.error('El tipo de contenido no es texto', {
          contentType: content.type,
          userId
        });
        return 'Lo siento, recibí un formato de respuesta que no puedo procesar. Por favor, intenta de nuevo.';
      }

      const response = content.text.value;
      logger.info('Respuesta generada', {
        userId,
        responseLength: response.length,
        messageId: assistantMessage.id
      });

      return response;

    } catch (error) {
      logger.error('Error al procesar mensaje', {
        error: (error as Error).message,
        userId
      });
      return 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo más tarde.';
    }
  }

  /**
   * Busca o crea un thread para el usuario
   */
  async findOrCreateThread(userId: string) {
    // Buscar el thread en la base de datos
    let userThread = await this.threadRepository.findByUserId(userId);

    // Si no existe, crear uno nuevo
    if (!userThread) {
      logger.info('Creando nuevo thread para usuario', { userId });
      
      // Crear el thread en OpenAI
      const newThread = await this.openai.beta.threads.create({
        metadata: {
          userId: userId
        }
      });
      
      // Crear una nueva entidad Thread
      const threadEntity = new Thread(
        newThread.id,
        userId,
        newThread.id,
        { created_by: 'openai_assistant' }
      );
      
      // Guardar en la base de datos
      userThread = await this.threadRepository.create(threadEntity);
      
      logger.info('Thread creado correctamente', {
        userId,
        threadId: newThread.id
      });
    }

    return userThread;
  }

  /**
   * Envía un mensaje al asistente y obtiene la respuesta
   */
  async sendMessage(threadId: string, content: string): Promise<string> {
    try {
      logger.info('Enviando mensaje al asistente', { threadId, contentLength: content.length });
      
      // Agregar el mensaje al thread
      await this.addMessageToThread(threadId, content);
      
      // Ejecutar el asistente
      const response = await this.runAssistant(threadId);
      
      logger.info('Respuesta del asistente obtenida', { threadId, responseLength: response.length });
      
      return response;
    } catch (error) {
      logger.error('Error al enviar mensaje al asistente', {
        error: (error as Error).message,
        threadId
      });
      throw new Error('No se pudo procesar el mensaje');
    }
  }

  /**
   * Crea un nuevo thread en OpenAI y devuelve su ID
   */
  async createThread(): Promise<string> {
    try {
      await this.getOrCreateAssistant();
      
      logger.info('Creando nuevo thread en OpenAI');
      
      const thread = await this.openai.beta.threads.create();
      
      logger.info('Thread creado correctamente', { threadId: thread.id });
      
      return thread.id;
    } catch (error) {
      logger.error('Error al crear thread', {
        error: (error as Error).message
      });
      throw new Error('No se pudo crear el thread');
    }
  }
} 