import { Router, Request, Response } from 'express';
import { WebhookController } from '../controllers/whatsapp/WebhookController';
import { webhookAuthMiddleware } from '../middlewares/whatsapp/webhookAuth';
import { logger } from '@utils/logger';

const router = Router();
const webhookController = new WebhookController();

// Ruta para verificar que el servicio está funcionando
router.get('/status', (req: Request, res: Response) => {
  logger.info('Verificación de estado del servicio WhatsApp', { ip: req.ip });
  res.status(200).json({
    status: 'UP',
    service: 'WhatsApp Integration',
    timestamp: new Date().toISOString()
  });
});

// Ruta del webhook de WhatsApp
// GET: Para verificación del webhook
// POST: Para recepción de mensajes
router.all(
  '/webhook',
  webhookAuthMiddleware,
  (req: Request, res: Response) => {
    if (req.method === 'POST') {
      // Solo procesamos POST para mensajes entrantes
      return webhookController.handleIncomingMessage(req, res);
    }
    // GET ya fue manejado por el middleware de autenticación
  }
);

export default router; 