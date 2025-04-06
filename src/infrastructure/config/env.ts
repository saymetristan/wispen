import 'dotenv/config';
import { logger } from '../../utils/logger';

/**
 * Obtiene una variable de entorno y lanza un error si no existe
 * @param name Nombre de la variable de entorno
 * @param defaultValue Valor por defecto si no existe
 * @returns Valor de la variable de entorno
 */
const getEnvVariable = (name: string, defaultValue?: string): string => {
  const value = process.env[name] || defaultValue;
  
  if (!value) {
    logger.warn(`Variable de entorno ${name} no definida`);
  }
  
  return value || '';
};

/**
 * Variables de entorno de la aplicación
 */
export const env = {
  // General
  NODE_ENV: getEnvVariable('NODE_ENV', 'development'),
  PORT: getEnvVariable('PORT', '3000'),
  
  // Base de datos
  DATABASE_URL: getEnvVariable('DATABASE_URL'),
  
  // WhatsApp API
  WHATSAPP_API_URL: getEnvVariable('WHATSAPP_API_URL', 'https://graph.facebook.com'),
  WHATSAPP_API_VERSION: getEnvVariable('WHATSAPP_API_VERSION', 'v17.0'),
  WHATSAPP_PHONE_NUMBER_ID: getEnvVariable('WHATSAPP_PHONE_NUMBER_ID'),
  WHATSAPP_ACCESS_TOKEN: getEnvVariable('WHATSAPP_ACCESS_TOKEN'),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: getEnvVariable('WHATSAPP_WEBHOOK_VERIFY_TOKEN'),
  
  // OpenAI
  OPENAI_API_KEY: getEnvVariable('OPENAI_API_KEY'),
  OPENAI_ASSISTANT_ID: getEnvVariable('OPENAI_ASSISTANT_ID'),
};

// Exportar configuraciones específicas
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test'; 