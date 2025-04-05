import * as express from 'express';
import { Express, Request, Response, NextFunction } from 'express';
import { logger } from '@utils/logger';

/**
 * Configura el servidor Express con los middleware y rutas necesarias
 */
export const configureServer = (app: Express): void => {
  // Middleware para parsear JSON
  app.use(express.json());
  
  // Middleware para logging de peticiones
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });
  
  // Ruta de verificación de salud
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', message: 'Wispen está funcionando correctamente' });
  });
  
  // Manejo de errores global
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error(`Error: ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: 'Error interno del servidor' });
  });
}; 