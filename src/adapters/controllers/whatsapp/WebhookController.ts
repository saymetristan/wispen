import { Request, Response } from 'express';
import { WhatsAppService } from '@infrastructure/services/whatsapp/WhatsAppService';
import { logger } from '@utils/logger';

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
        contacts?: Array<any>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: {
            body: string;
          };
        }>;
        statuses?: Array<any>;
      };
      field: string;
    }>;
  }>;
}

/**
 * Controlador para gestionar las solicitudes al webhook de WhatsApp
 */
export class WebhookController {
  private whatsappService: WhatsAppService;

  constructor() {
    this.whatsappService = new WhatsAppService();
  }

  /**
   * Maneja las solicitudes POST al webhook (recepción de mensajes)
   */
  async handleIncomingMessage(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body as WhatsAppWebhookPayload;

      // Verificar formato básico
      if (!data || !data.object) {
        logger.warn('Payload inválido recibido en webhook', { body: req.body });
        res.status(400).send('Invalid payload');
        return;
      }

      // Verificar que es un evento de WhatsApp
      if (data.object !== 'whatsapp_business_account') {
        logger.warn('Objeto inesperado recibido en webhook', { object: data.object });
        res.status(400).send('Unexpected object');
        return;
      }

      // Procesamiento del mensaje (asíncrono)
      // Respondemos 200 OK inmediatamente según recomienda Meta
      res.status(200).send('OK');

      // Procesamos el mensaje después de responder
      const result = await this.whatsappService.processIncomingMessage(data);
      
      if (!result) {
        logger.warn('Procesamiento de mensaje falló', { 
          object: data.object,
          entries: data.entry?.length
        });
      }
    } catch (error) {
      logger.error('Error al procesar webhook', {
        error: (error as Error).message,
        stack: (error as Error).stack
      });
      // Intentar responder si aún no se ha enviado la respuesta
      if (!res.headersSent) {
        res.status(500).send('Error processing webhook');
      }
    }
  }
} 