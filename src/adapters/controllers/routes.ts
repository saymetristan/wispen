import { Express } from 'express';
import { WebhookController } from './whatsapp/WebhookController';
import { WhatsAppService } from '../../infrastructure/services/whatsapp/WhatsAppService';
import { OpenAIAssistantService } from '../../infrastructure/services/openai/OpenAIAssistantService';
import { RepositoryFactory } from '../../core/domain/factories/RepositoryFactory';
import { UserOnboardingUseCase } from '../../core/usecases/user/UserOnboardingUseCase';

/**
 * Configurar las rutas de la aplicación
 */
export function configureRoutes(
  app: Express,
  webhookController: WebhookController
): void {
  // Rutas de webhook de WhatsApp
  app.get('/webhook', (req, res) => webhookController.verifyWebhook(req, res));
  app.post('/webhook', (req, res) => webhookController.handleIncomingMessage(req, res));
  
  // Ruta de health check
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // Ruta raíz
  app.get('/', (req, res) => {
    res.status(200).json({
      app: 'Wispen Financial Assistant',
      version: '1.0.0',
      status: 'running'
    });
  });
}

/**
 * Crear y configurar el controlador de webhook
 */
export function createWebhookController(
  whatsAppService: WhatsAppService,
  openAIAssistantService: OpenAIAssistantService,
  repositoryFactory: RepositoryFactory
): WebhookController {
  const userOnboardingUseCase = new UserOnboardingUseCase(repositoryFactory, whatsAppService);
  
  return new WebhookController(
    whatsAppService,
    openAIAssistantService,
    repositoryFactory,
    userOnboardingUseCase
  );
} 