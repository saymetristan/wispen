/**
 * Clase base para errores de la aplicación
 * Extiende el Error nativo y agrega propiedades para manejo de errores HTTP
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode?: string,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    
    // Configurar stack trace apropiadamente
    Error.captureStackTrace(this, this.constructor);
    
    // Set the prototype explicitly to maintain instanceof behavior after transpilation
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Errores específicos que la aplicación podría lanzar
export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso no encontrado', errorCode?: string) {
    super(message, 404, errorCode, true);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Error de validación', errorCode?: string) {
    super(message, 400, errorCode, true);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'No autorizado', errorCode?: string) {
    super(message, 401, errorCode, true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acceso prohibido', errorCode?: string) {
    super(message, 403, errorCode, true);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Error interno del servidor', errorCode?: string) {
    super(message, 500, errorCode, false);
  }
}

// Errores de integración con servicios externos
export class ExternalServiceError extends AppError {
  constructor(message: string = 'Error en servicio externo', errorCode?: string) {
    super(message, 502, errorCode, false);
  }
} 