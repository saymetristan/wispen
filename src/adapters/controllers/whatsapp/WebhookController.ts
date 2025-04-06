import { Request, Response } from 'express';
import { WhatsAppService } from '@infrastructure/services/whatsapp/WhatsAppService';
import { OpenAIAssistantService } from '@infrastructure/services/openai/OpenAIAssistantService';
import { RepositoryFactory } from '@core/domain/factories/RepositoryFactory';
import { ProcessWhatsAppMessage } from '@core/usecases/ProcessWhatsAppMessage';
import { UserOnboardingUseCase } from '@core/usecases/user/UserOnboardingUseCase';
import { logger } from '@utils/logger';

// Definición de tipos para el contacto y estado
interface WhatsAppContact {
  input: string;
  wa_id: string;
  name?: string;
}

interface WhatsAppStatus {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
}

// Importamos la interfaz (añádela aquí o crea un archivo separado para tipos compartidos)
interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<WhatsAppContact>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: {
            body: string;
          };
        }>;
        statuses?: Array<WhatsAppStatus>;
      };
      field: string;
    }>;
  }>;
}

/**
 * Controlador para gestionar las solicitudes al webhook de WhatsApp
 */
export class WebhookController {
  private whatsAppService: WhatsAppService;
  private openAIAssistantService: OpenAIAssistantService;
  private repositoryFactory: RepositoryFactory;
  private processMessageUseCase: ProcessWhatsAppMessage;
  private userOnboardingUseCase: UserOnboardingUseCase;

  constructor(
    whatsAppService: WhatsAppService,
    openAIAssistantService: OpenAIAssistantService,
    repositoryFactory: RepositoryFactory,
    userOnboardingUseCase: UserOnboardingUseCase
  ) {
    this.whatsAppService = whatsAppService;
    this.openAIAssistantService = openAIAssistantService;
    this.repositoryFactory = repositoryFactory;
    this.userOnboardingUseCase = userOnboardingUseCase;
    
    this.processMessageUseCase = new ProcessWhatsAppMessage(
      this.repositoryFactory,
      this.whatsAppService,
      this.openAIAssistantService,
      this.userOnboardingUseCase
    );
  }

  /**
   * Maneja la verificación del webhook desde Meta
   */
  verifyWebhook(req: Request, res: Response): void {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      logger.info('Webhook verificado correctamente');
      res.status(200).send(challenge);
    } else {
      logger.error('Verificación de webhook fallida', { mode, token });
      res.sendStatus(403);
    }
  }

  /**
   * Maneja los mensajes entrantes desde WhatsApp
   */
  async handleIncomingMessage(req: Request, res: Response): Promise<void> {
    try {
      // Enviamos respuesta 200 inmediatamente para cumplir con los requisitos de Facebook
      res.status(200).send('EVENT_RECEIVED');

      // Extraemos los mensajes del webhook
      const messages = this.extractMessages(req.body);

      if (messages.length === 0) {
        logger.info('No se encontraron mensajes en el webhook');
        return;
      }

      // Procesamos cada mensaje de forma asíncrona
      messages.forEach(async (message) => {
        await this.processMessage(message);
      });
    } catch (error) {
      logger.error('Error al procesar mensajes de webhook', {
        error: (error as Error).message,
        body: req.body
      });
    }
  }

  /**
   * Extrae los mensajes de la carga útil del webhook
   */
  private extractMessages(body: any): any[] {
    try {
      if (!body.entry || !body.entry.length) {
        return [];
      }

      const messages: any[] = [];

      // Recorrer todas las entradas y cambios para extraer mensajes
      body.entry.forEach((entry: any) => {
        if (entry.changes && entry.changes.length) {
          entry.changes.forEach((change: any) => {
            if (
              change.value &&
              change.value.messages &&
              change.value.messages.length
            ) {
              // Agregar todos los mensajes encontrados
              messages.push(...change.value.messages.map((msg: any) => ({
                ...msg,
                from: change.value.contacts?.[0]?.wa_id || msg.from,
                contactName: change.value.contacts?.[0]?.profile?.name || 'Unknown'
              })));
            }
          });
        }
      });

      return messages;
    } catch (error) {
      logger.error('Error al extraer mensajes del webhook', {
        error: (error as Error).message
      });
      return [];
    }
  }

  /**
   * Procesa un mensaje individual
   */
  private async processMessage(message: any): Promise<void> {
    try {
      logger.info('Procesando mensaje entrante', {
        messageId: message.id,
        from: message.from,
        type: message.type
      });

      // Verificar si es un mensaje de texto o de inicio de WhatsApp
      if (message.type === 'text') {
        const text = message.text.body.trim();
        
        // Verificar si es un comando de inicio/reinicio
        if (text.toLowerCase() === '/start' || text.toLowerCase() === '/iniciar') {
          await this.startOnboarding(message.from, message.contactName);
          return;
        }
        
        // Procesar el mensaje normalmente
        await this.processMessageUseCase.execute({
          phoneNumber: message.from,
          message: text,
          userName: message.contactName
        });
      } else {
        logger.info('Mensaje no procesado (no es texto)', {
          messageId: message.id,
          type: message.type
        });
      }
    } catch (error) {
      logger.error('Error al procesar mensaje individual', {
        error: (error as Error).message,
        messageId: message.id,
        from: message.from
      });
    }
  }

  /**
   * Inicia el proceso de onboarding para un usuario
   */
  private async startOnboarding(phoneNumber: string, name?: string): Promise<void> {
    try {
      logger.info('Iniciando onboarding para usuario', { phoneNumber, name });
      
      // Buscar el usuario
      const userRepository = this.repositoryFactory.createUserRepository();
      let user = await userRepository.getUserByPhoneNumber(phoneNumber);
      
      if (user) {
        // Si el usuario ya existe, actualizamos su nombre si viene
        if (name && !user.name) {
          user.name = name;
          user = await userRepository.updateUser(user);
        }
      } else {
        logger.error('No se pudo iniciar onboarding: usuario no encontrado', { phoneNumber });
        return;
      }
      
      // Iniciar el proceso de onboarding
      await this.userOnboardingUseCase.startOnboarding(user);
      
    } catch (error) {
      logger.error('Error al iniciar onboarding desde webhook', {
        error: (error as Error).message,
        phoneNumber
      });
    }
  }
} 