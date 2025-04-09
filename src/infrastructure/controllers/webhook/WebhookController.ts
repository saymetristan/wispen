import { Router, Request, Response } from 'express';
import { WhatsAppService } from '@infrastructure/services/whatsapp/WhatsAppService';
import { OpenAIAssistantService } from '@infrastructure/services/openai/OpenAIAssistantService';
import { RepositoryFactory } from '@infrastructure/database/RepositoryFactory';
import { UserOnboardingUseCase } from '@core/usecases/user/UserOnboardingUseCase';
import { logger } from '@utils/logger';
import { env } from '@infrastructure/config/env';

/**
 * Controlador para el webhook de WhatsApp
 */
export class WebhookController {
  private router = Router();

  constructor(
    private whatsAppService: WhatsAppService,
    private openAIAssistantService: OpenAIAssistantService,
    private repositoryFactory: RepositoryFactory,
    private userOnboardingUseCase: UserOnboardingUseCase
  ) {
    this.initializeRoutes();
  }

  /**
   * Inicializa las rutas del webhook
   */
  private initializeRoutes(): void {
    // Verificación del webhook (GET)
    this.router.get('/', this.verifyWebhook.bind(this));
    
    // Recepción de mensajes (POST)
    this.router.post('/', this.handleWebhook.bind(this));
  }

  /**
   * Verifica el webhook de WhatsApp (GET)
   */
  private verifyWebhook(req: Request, res: Response): void {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode === 'subscribe' && token === env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
      res.status(200).send(challenge);
      logger.info('Webhook verificado correctamente');
    } else {
      res.sendStatus(403);
      logger.warn('Verificación de webhook fallida');
    }
  }

  /**
   * Maneja los mensajes entrantes del webhook (POST)
   */
  private async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      // Responder de inmediato para cumplir con los requisitos de Facebook
      res.status(200).send('EVENT_RECEIVED');
      
      logger.info('Webhook recibido', { body: req.body });
      
      // Procesamiento asíncrono del webhook
      // Implementación detallada omitida por simplicidad
      
    } catch (error) {
      logger.error('Error al procesar webhook', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Retorna el router para ser usado por Express
   */
  getRoutes(): Router {
    return this.router;
  }
} 