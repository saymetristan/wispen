import { Request, Response, NextFunction } from 'express';
import { WhatsAppService } from '@infrastructure/services/whatsapp/WhatsAppService';
import { logger } from '@utils/logger';

/**
 * Middleware para autenticar las solicitudes del webhook de WhatsApp
 * - Verifica solicitudes GET para la validación del webhook
 * - Permite pasar solicitudes POST para el procesamiento de mensajes
 */
export const webhookAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Solicitud GET para verificación del webhook
  if (req.method === 'GET') {
    try {
      const mode = req.query['hub.mode'] as string;
      const token = req.query['hub.verify_token'] as string;
      const challenge = req.query['hub.challenge'] as string;

      // Verificar parámetros necesarios
      if (!mode || !token) {
        logger.warn('Intento de verificación de webhook sin parámetros necesarios', {
          ip: req.ip,
          params: req.query
        });
        res.status(400).send('Parámetros de verificación incorrectos');
        return;
      }

      // Utilizar el servicio para verificar
      const whatsappService = new WhatsAppService();
      const verification = whatsappService.verifyWebhook(mode, token, challenge);

      if (verification.isValid) {
        // Responder con el challenge para completar la verificación
        res.status(200).send(verification.challenge);
      } else {
        logger.warn('Intento de verificación de webhook con token inválido', {
          ip: req.ip,
          mode,
          token: token.substring(0, 4) + '***' // Loggear solo parte del token por seguridad
        });
        res.status(403).send('Token de verificación inválido');
      }
    } catch (error) {
      logger.error('Error en la verificación del webhook', {
        error: (error as Error).message
      });
      res.status(500).send('Error interno en la verificación');
    }
    return;
  }

  // Solicitud POST para procesar mensajes (no requiere verificación adicional)
  if (req.method === 'POST') {
    // Verificar la firma del webhook si estuviera disponible
    // (Implementación futura: HMAC verification)
    
    // Continuar con el procesamiento
    next();
    return;
  }

  // Método no permitido
  res.status(405).send('Método no permitido');
}; 