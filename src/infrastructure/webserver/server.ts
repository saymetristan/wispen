import * as express from 'express';
import { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { logger } from '@utils/logger';
import { errorHandler, notFoundHandler } from '@utils/errors/errorHandler';
import { env } from '@infrastructure/config/env';
import apiRoutes from '@adapters/routes';

// Middleware de logging simple para HTTP requests
const httpLogger = (req: Request, res: Response, next: express.NextFunction): void => {
  const start = Date.now();
  
  // Capturar cuando la respuesta termina
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent') || '',
      ip: req.ip,
    });
  });
  
  next();
};

/**
 * Configura la aplicación Express con middlewares esenciales
 * @param app Instancia de Express
 */
export const configureServer = (app: Express): void => {
  // Middlewares básicos de seguridad y optimización
  app.use(helmet()); // Seguridad HTTP
  app.use(cors()); // Habilitar CORS
  app.use(compression()); // Comprimir respuestas
  app.use(express.json()); // Parsear JSON en el body
  app.use(express.urlencoded({ extended: true })); // Parsear URL-encoded

  // Logger para peticiones HTTP
  app.use(httpLogger);

  // Ruta de estado/salud
  app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  });

  // Registrar las rutas de la API
  app.use('/api/v1', apiRoutes);

  // Manejo de rutas no encontradas (404)
  app.use(notFoundHandler);

  // Manejo centralizado de errores
  app.use(errorHandler);
}; 