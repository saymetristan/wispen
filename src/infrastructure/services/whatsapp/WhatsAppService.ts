import axios, { AxiosResponse } from 'axios';
import { logger } from '@utils/logger';
import { env } from '@infrastructure/config/env';
import { ProcessWhatsAppMessage } from '@core/usecases/ProcessWhatsAppMessage';

// Interfaces para tipado
interface WhatsAppMessageResponse {
  messaging_product: string;
  contacts?: Array<{ input: string; wa_id: string }>;
  messages?: Array<{ id: string }>;
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
    this.apiUrl = env.WHATSAPP_API_URL;
    this.apiVersion = env.WHATSAPP_API_VERSION;
    this.phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = env.WHATSAPP_ACCESS_TOKEN;
  }

  /**
   * Envía un mensaje de texto a un número de WhatsApp
   * @param to Número de teléfono de destino (formato internacional sin +)
   * @param text Texto del mensaje
   * @returns Respuesta de la API de WhatsApp
   */
  async sendTextMessage(to: string, text: string): Promise<WhatsAppMessageResponse> {
    try {
      const url = `${this.apiUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
      
      const data = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: text }
      };

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      };

      const response: AxiosResponse<WhatsAppMessageResponse> = await axios.post(url, data, { headers });
      
      logger.info('Mensaje enviado correctamente a WhatsApp', { 
        to,
        messageId: response.data?.messages?.[0]?.id 
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Error al enviar mensaje a WhatsApp', {
          to,
          status: error.response?.status,
          error: error.response?.data || error.message
        });
      } else {
        logger.error('Error desconocido al enviar mensaje a WhatsApp', {
          to,
          error: (error as Error).message
        });
      }
      throw error;
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
    const verifyToken = env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    
    if (mode === 'subscribe' && token === verifyToken) {
      logger.info('Webhook de WhatsApp verificado correctamente');
      return { isValid: true, challenge };
    }
    
    logger.warn('Verificación de webhook de WhatsApp fallida', { mode, token });
    return { isValid: false };
  }

  /**
   * Procesa un mensaje entrante de WhatsApp
   * @param data Datos del mensaje recibido
   * @returns Verdadero si el procesamiento fue exitoso
   */
  async processIncomingMessage(data: WhatsAppWebhookPayload): Promise<boolean> {
    try {
      if (!data.entry || !data.entry[0]?.changes || !data.entry[0]?.changes[0]?.value) {
        logger.warn('Mensaje de WhatsApp con formato inválido', { data });
        return false;
      }

      const value = data.entry[0].changes[0].value;
      
      // Verificar si es un mensaje y no una entrega/lectura
      if (!value.messages || !value.messages[0]) {
        logger.debug('Evento de WhatsApp sin mensajes', { 
          type: value.statuses ? 'status' : 'unknown' 
        });
        return true; // No es un error, pero no hay mensajes para procesar
      }

      const message = value.messages[0];
      const from = message.from;
      const messageId = message.id;

      // Procesar según el tipo de mensaje
      if (message.type === 'text' && message.text) {
        const text = message.text.body;
        logger.info('Mensaje de texto recibido', { from, messageId, text });
        
        // Usar el caso de uso para procesar el mensaje
        const processMessage = new ProcessWhatsAppMessage();
        const response = await processMessage.execute(from, text);
        
        // Enviar respuesta al usuario
        await this.sendTextMessage(from, response);
      } else {
        logger.info('Mensaje no soportado recibido', { from, messageId, type: message.type });
        await this.sendTextMessage(from, 'Tipo de mensaje no soportado aún.');
      }

      return true;
    } catch (error) {
      logger.error('Error al procesar mensaje entrante de WhatsApp', {
        error: (error as Error).message,
        data
      });
      return false;
    }
  }
}