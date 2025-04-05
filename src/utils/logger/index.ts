import * as winston from 'winston';

/**
 * Configura y devuelve un logger de Winston simplificado
 */
export const setupLogger = () => {
  // Crear una configuración básica sin los formatos complejos
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'wispen-service' },
    transports: [
      new winston.transports.Console()
    ],
  });

  return logger;
};

// Exportar una instancia pre-configurada para uso común
export const logger = setupLogger();
