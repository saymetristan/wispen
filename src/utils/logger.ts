import * as winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';
import { Request, Response, NextFunction } from 'express';

// Crear directorio de logs si no existe
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Formato para todos los logs
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf((info: winston.Logform.TransformableInfo) => {
    const { timestamp, level, message, ...meta } = info;
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta) : ''
    }`;
  })
);

// Crear el logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Escribir todos los logs a la consola
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    // Escribir logs de error a un archivo
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error'
    }),
    // Escribir todos los logs a un archivo
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log')
    })
  ]
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