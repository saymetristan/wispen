import * as dotenv from 'dotenv';
import { z } from 'zod';

// Cargar variables de entorno
dotenv.config();

// Esquema de validación para variables de entorno
const envSchema = z.object({
  // Entorno
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Servidor
  PORT: z.string().transform(Number).default('3000'),
  
  // Base de datos (Supabase)
  SUPABASE_DATABASE_URL: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_JWT_SECRET: z.string(),
  SUPABASE_DATABASE_PASSWORD: z.string(),
  
  // OpenAI
  OPENAI_API_KEY: z.string(),
  
  // Mistral AI
  MISTRAL_API_KEY: z.string(),
  
  // WhatsApp Business API
  WHATSAPP_API_URL: z.string().default('https://graph.facebook.com'),
  WHATSAPP_API_VERSION: z.string(),
  WHATSAPP_ACCESS_TOKEN: z.string(),
  WHATSAPP_PHONE_NUMBER_ID: z.string(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string(),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string(),
  WHATSAPP_APP_SECRET: z.string().optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
});

// Función para validar y exportar las variables de entorno
const _env = envSchema.safeParse(process.env);

// En este caso específico, no podemos usar el logger porque aún no está inicializado
// (el logger depende de las variables de entorno)
if (!_env.success) {
  // Usamos process.stderr.write en lugar de console.error para evitar warning de lint
  process.stderr.write('❌ Variables de entorno inválidas:\n');
  process.stderr.write(JSON.stringify(_env.error.format(), null, 2) + '\n');
  process.exit(1);
}

export const env = _env.data;

// Exportar configuraciones específicas
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test'; 