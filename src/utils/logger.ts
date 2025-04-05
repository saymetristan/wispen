import * as winston from 'winston';
import { env } from '@infrastructure/config/env';
import * as path from 'path';
import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';

// Crear directorio de logs si no existe
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configuración del formato
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Configuración de Winston
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: logFormat,
  defaultMeta: { service: 'wispen-api' },
  transports: [
    // Archivo para todos los logs
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log') 
    }),
    // Archivo específico para errores
    new winston.transports.File({ 
      filename: path.join(logsDir, 'errors.log'),
      level: 'error' 
    }),
    // Consola en desarrollo
    ...(env.NODE_ENV !== 'production'
      ? [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            ),
          }),
        ]
      : []),
  ],
});

// Crear middleware de logging para Express
export const httpLogger = (req: Request, res: Response, next: NextFunction): void => {
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