import axios from 'axios';
import { logger } from '../../../utils/logger';
import prisma from '../../database/prisma';
import { OpenAIClient } from '../openai/OpenAIClient';
import { OpenAIAssistantService } from '../openai/OpenAIAssistantService';

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
 * Servicio para interactuar con la API de WhatsApp Business
 */
export class WhatsAppService {
  private readonly apiUrl: string;
  private readonly apiVersion: string;
  private readonly phoneNumberId: string;
  private readonly accessToken: string;

  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com';
    this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v17.0';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    
    if (!this.phoneNumberId) {
      logger.warn('WhatsApp API: No se ha configurado WHATSAPP_PHONE_NUMBER_ID');
    }
    
    if (!this.accessToken) {
      logger.warn('WhatsApp API: No se ha configurado WHATSAPP_ACCESS_TOKEN');
    }
    
    if (this.phoneNumberId && this.accessToken) {
      logger.info('WhatsApp API: Servicio inicializado correctamente');
    }
  }

  /**
   * Envía un mensaje de texto a un número de WhatsApp
   * @param to Número de teléfono de destino (formato internacional sin +)
   * @param text Texto del mensaje
   * @returns Respuesta de la API de WhatsApp
   */
  async sendTextMessage(to: string, text: string): Promise<WhatsAppMessageResponse> {
    try {
      // Asegurar que el número de teléfono tiene el formato correcto
      const formattedTo = this.formatPhoneNumber(to);
      
      logger.info('Enviando mensaje de WhatsApp', { 
        to: formattedTo,
        textLength: text.length
      });
      
      const response = await axios.post(
        `${this.apiUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedTo,
          type: 'text',
          text: {
            preview_url: false,
            body: text
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );
      
      logger.info('Mensaje enviado correctamente', {
        to: formattedTo,
        response: response.data
      });
      
      return response.data;
    } catch (error) {
      logger.error('Error al enviar mensaje de WhatsApp', {
        error: (error as Error).message,
        to,
        textLength: text.length
      });
      
      throw new Error('No se pudo enviar el mensaje de WhatsApp');
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
      const openAIClient = new OpenAIClient();
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