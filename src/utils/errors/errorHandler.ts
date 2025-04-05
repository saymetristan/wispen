import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';
import { logger } from '../logger';
import { env } from '@infrastructure/config/env';

/**
 * Middleware para manejar errores de forma centralizada
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Por defecto es un error del servidor
  let statusCode = 500;
  let errorMessage = 'Error interno del servidor';
  let errorCode: string | undefined = undefined;
  let isOperational = false;
  
  // Verificar si es un error personalizado de la aplicación
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorMessage = err.message;
    errorCode = err.errorCode;
    isOperational = err.isOperational;
  }
  
  // Estructurar respuesta
  const errorResponse = {
    success: false,
    error: {
      message: errorMessage,
      code: errorCode,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  };
  
  // Registrar error
  if (isOperational) {
    logger.warn(`Error operacional: ${errorMessage}`, { 
      statusCode, 
      errorCode,
      path: req.path,
      method: req.method,
      stack: err.stack
    });
  } else {
    logger.error(`Error no operacional: ${errorMessage}`, {
      statusCode,
      errorCode,
      path: req.path,
      method: req.method,
      stack: err.stack
    });
  }
  
  // Enviar respuesta al cliente
  res.status(statusCode).json(errorResponse);
};

/**
 * Middleware para capturar errores de tipo 404 (rutas no encontradas)
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const message = `Ruta no encontrada: ${req.originalUrl}`;
  const notFoundError = new AppError(message, 404, 'ROUTE_NOT_FOUND');
  next(notFoundError);
};

/**
 * Wrapper para funciones asíncronas que evita try/catch en cada controlador
 */
export const asyncHandler = (fn: Function) => 
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  }; 