import axios from 'axios';
import { logger } from '@utils/logger';
import prisma from '../../database/prisma';
import { OpenAIClient } from '../openai/OpenAIClient';
import { OpenAIAssistantService } from '../openai/OpenAIAssistantService';
import { RepositoryFactory, PrismaRepositoryFactoryImpl } from '@infrastructure/database/RepositoryFactory';

// Interfaces para tipado
export interface WhatsAppMessageResponse {
  messaging_product: string;
  contacts?: Array<{
    input: string;
    wa_id: string;
  }>;
  messages?: Array<{
    id: string;
  }>;
}

interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: {
    body: string;
  };
  // Otros tipos de mensajes se agregarán según sea necesario
}

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

interface WhatsAppValue {
  messaging_product: string;
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: Array<WhatsAppContact>;
  messages?: Array<WhatsAppMessage>;
  statuses?: Array<WhatsAppStatus>;
}

interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: WhatsAppValue;
      field: string;
    }>;
  }>;
}

/**
 * Configuración para el servicio de WhatsApp
 */
export interface WhatsAppConfig {
  apiUrl: string;
  apiVersion: string;
  phoneNumberId: string;
  accessToken: string;
  verifyToken?: string;
  appSecret?: string;
  businessAccountId?: string;
}

/**
 * Servicio para interactuar con la API de WhatsApp
 */
export class WhatsAppService {
  private apiUrl: string;
  private phoneNumberId: string;
  private accessToken: string;
  private repositoryFactory: RepositoryFactory;

  constructor(
    config: WhatsAppConfig,
    repositoryFactory: RepositoryFactory = new PrismaRepositoryFactoryImpl()
  ) {
    this.apiUrl = `${config.apiUrl}/${config.apiVersion}/${config.phoneNumberId}`;
    this.phoneNumberId = config.phoneNumberId;
    this.accessToken = config.accessToken;
    this.repositoryFactory = repositoryFactory;
  }

  /**
   * Envía un mensaje de texto a un número de teléfono
   * @param phoneNumber Número de teléfono del destinatario
   * @param message Mensaje a enviar
   */
  async sendText(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: this.formatPhoneNumber(phoneNumber),
          type: 'text',
          text: { body: message }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      logger.info('Mensaje enviado correctamente', {
        to: phoneNumber,
        messageId: response.data?.messages?.[0]?.id
      });

      return true;
    } catch (error) {
      logger.error('Error al enviar mensaje', {
        error: error instanceof Error ? error.message : String(error),
        to: phoneNumber
      });
      return false;
    }
  }

  /**
   * Extrae el número de teléfono del remitente de un webhook
   * @param webhookBody Cuerpo del webhook
   */
  extractSenderPhone(webhookBody: any): string | null {
    try {
      const entry = webhookBody.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      
      if (!value || !value.messages || value.messages.length === 0) {
        return null;
      }
      
      return value.messages[0].from;
    } catch (error) {
      logger.error('Error al extraer teléfono del remitente', {
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Extrae el texto del mensaje de un webhook
   * @param webhookBody Cuerpo del webhook
   */
  extractMessageText(webhookBody: any): string | null {
    try {
      const entry = webhookBody.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      
      if (!value || !value.messages || value.messages.length === 0) {
        return null;
      }
      
      const message = value.messages[0];
      
      if (message.type === 'text') {
        return message.text.body;
      }
      
      return null;
    } catch (error) {
      logger.error('Error al extraer texto del mensaje', {
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Verifica si un webhook es válido según el token de verificación
   * @param mode Modo de verificación
   * @param token Token enviado en la solicitud
   * @param challenge Challenge enviado en la solicitud
   * @returns Objeto con la validación y el challenge si es exitoso
   */
  verifyWebhook(mode: string, token: string, challenge: string): { isValid: boolean, challenge?: string } {
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '';
    
    if (mode === 'subscribe' && token === verifyToken) {
      logger.info('Webhook de WhatsApp verificado correctamente');
      return { isValid: true, challenge };
    }
    
    logger.warn('Verificación de webhook de WhatsApp fallida', { mode, token });
    return { isValid: false };
  }

  /**
   * Procesa un mensaje de texto y genera una respuesta
   */
  async processIncomingMessage(from: string, text: string): Promise<string> {
    try {
      logger.info('Procesando mensaje entrante para respuesta', {
        from,
        text: text.substring(0, 50) + (text.length > 50 ? '...' : '')
      });
      
      // Inicializar servicios
      const openAIClient = new OpenAIClient(process.env.OPENAI_API_KEY || '');
      const openAIAssistantService = new OpenAIAssistantService(
        openAIClient,
        process.env.OPENAI_ASSISTANT_ID || '',
        prisma
      );
      
      // Usar directamente el asistente de OpenAI para procesar el mensaje
      const response = await openAIAssistantService.processMessage(from, text);
      
      // Si es un mensaje de error, enviamos una respuesta genérica
      if (response.includes('Lo siento, ocurrió un error')) {
        return 'Lo siento, tuve un problema al procesar tu mensaje. Por favor, intenta de nuevo más tarde.';
      }
      
      // Cerrar la conexión de Prisma al finalizar
      await prisma.$disconnect();
      
      return response;
    } catch (error) {
      logger.error('Error al procesar mensaje entrante', {
        error: (error as Error).message,
        from
      });
      return 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo más tarde.';
    }
  }

  /**
   * Formatea un número de teléfono para uso con WhatsApp API
   */
  private formatPhoneNumber(phone: string): string {
    // Si ya tiene el prefijo whatsapp:, lo eliminamos
    let formattedPhone = phone.replace('whatsapp:', '');
    
    // Eliminar todos los caracteres que no sean números
    formattedPhone = formattedPhone.replace(/\D/g, '');
    
    // Verificar que tenga al menos 10 dígitos
    if (formattedPhone.length < 10) {
      throw new Error('Número de teléfono inválido');
    }
    
    return formattedPhone;
  }
}