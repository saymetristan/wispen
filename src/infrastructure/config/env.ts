import 'dotenv/config';
import { logger } from '@utils/logger';

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
  DIRECT_URL: getEnvVariable('DIRECT_URL'),
  
  // Supabase
  SUPABASE_DATABASE_URL: getEnvVariable('SUPABASE_DATABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: getEnvVariable('SUPABASE_SERVICE_ROLE_KEY'),
  SUPABASE_ANON_KEY: getEnvVariable('SUPABASE_ANON_KEY'),
  SUPABASE_JWT_SECRET: getEnvVariable('SUPABASE_JWT_SECRET'),
  SUPABASE_DATABASE_PASSWORD: getEnvVariable('SUPABASE_DATABASE_PASSWORD'),
  
  // WhatsApp API
  WHATSAPP_API_URL: getEnvVariable('WHATSAPP_API_URL', 'https://graph.facebook.com'),
  WHATSAPP_API_VERSION: getEnvVariable('WHATSAPP_API_VERSION', 'v18.0'),
  WHATSAPP_PHONE_NUMBER_ID: getEnvVariable('WHATSAPP_PHONE_NUMBER_ID'),
  WHATSAPP_ACCESS_TOKEN: getEnvVariable('WHATSAPP_ACCESS_TOKEN'),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: getEnvVariable('WHATSAPP_WEBHOOK_VERIFY_TOKEN'),
  WHATSAPP_APP_SECRET: getEnvVariable('WHATSAPP_APP_SECRET'),
  WHATSAPP_BUSINESS_ACCOUNT_ID: getEnvVariable('WHATSAPP_BUSINESS_ACCOUNT_ID'),
  
  // OpenAI
  OPENAI_API_KEY: getEnvVariable('OPENAI_API_KEY'),
  OPENAI_ASSISTANT_ID: getEnvVariable('OPENAI_ASSISTANT_ID'),
  
  // Mistral AI
  MISTRAL_API_KEY: getEnvVariable('MISTRAL_API_KEY'),
  
  // Logging
  LOG_LEVEL: getEnvVariable('LOG_LEVEL', 'info'),
};

// Exportar configuraciones específicas
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Configuración unificada para servicios externos
export const config = {
  openai: {
    apiKey: env.OPENAI_API_KEY,
    assistantId: env.OPENAI_ASSISTANT_ID
  },
  whatsapp: {
    apiUrl: env.WHATSAPP_API_URL,
    apiVersion: env.WHATSAPP_API_VERSION,
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: env.WHATSAPP_ACCESS_TOKEN,
    verifyToken: env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    appSecret: env.WHATSAPP_APP_SECRET,
    businessAccountId: env.WHATSAPP_BUSINESS_ACCOUNT_ID
  },
  database: {
    url: env.DATABASE_URL,
    directUrl: env.DIRECT_URL
  }
}; 