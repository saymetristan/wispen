import * as express from 'express';
import { logger } from '@utils/logger';
import { configureServer } from '@infrastructure/webserver/server';
import { env } from '@infrastructure/config/env';
import { testSupabaseConnection } from '@infrastructure/database/supabase';
import { UserOnboardingUseCase } from './core/usecases/user/UserOnboardingUseCase';
import { PrismaRepositoryFactory } from '@infrastructure/database/prisma/PrismaRepositoryFactory';
import { WhatsAppService } from '@infrastructure/services/WhatsAppService';
import { OpenAIClient } from '@infrastructure/services/OpenAIClient';
import { OpenAIAssistantService } from '@infrastructure/services/OpenAIAssistantService';
import { WebhookController } from '@infrastructure/controllers/WebhookController';

// Inicialización asíncrona de la aplicación
async function bootstrap() {
  try {
    logger.info('Iniciando aplicación Wispen API');
    
    // Crear la aplicación Express
    const app = express();
    const port = env.PORT;
    
    logger.info(`Variables de entorno cargadas correctamente para entorno: ${env.NODE_ENV}`);

    // Verificar conexión a Supabase
    logger.info('Verificando conexión a Supabase...');
    const supabaseConnected = await testSupabaseConnection();
    if (!supabaseConnected) {
      logger.error('No se pudo establecer conexión con Supabase. Abortando inicialización.');
      process.exit(1);
    }
    
    // Configurar el servidor
    logger.info('Configurando servidor Express...');
    configureServer(app);

    // Inicializar servicios
    const repositoryFactory = new PrismaRepositoryFactory(prisma);
    const whatsAppService = new WhatsAppService();
    const openAIClient = new OpenAIClient(config.openai.apiKey);
    const openAIAssistantService = new OpenAIAssistantService(openAIClient, config.openai.assistantId);
    const userOnboardingUseCase = new UserOnboardingUseCase(repositoryFactory, whatsAppService);

    // Definir rutas y controladores
    const webHookController = new WebhookController(
      whatsAppService, 
      openAIAssistantService,
      repositoryFactory,
      userOnboardingUseCase
    );

    // Iniciar el servidor
    app.listen(port, () => {
      logger.info(`✅ Servidor iniciado correctamente en puerto ${port}`);
      logger.info(`⚙️ Entorno: ${env.NODE_ENV}`);
      logger.info(`🔗 API URL: http://localhost:${port}/api`);
      logger.info(`🚀 Wispen API está listo para recibir solicitudes`);
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Error al iniciar la aplicación', { 
        error: error.message,
        stack: error.stack 
      });
    } else {
      logger.error('Error desconocido al iniciar la aplicación', { error });
    }
    process.exit(1);
  }
}

// Iniciar la aplicación
bootstrap().catch((error) => {
  if (error instanceof Error) {
    logger.error('Error fatal durante el arranque', { 
      error: error.message,
      stack: error.stack 
    });
  } else {
    logger.error('Error fatal desconocido durante el arranque', { error });
  }
  process.exit(1);
});

// Manejo de eventos de cierre
process.on('SIGTERM', () => {
  logger.info('SIGTERM recibido. Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT recibido. Cerrando servidor...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('Excepción no capturada', { 
    error: error.message,
    stack: error.stack 
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  if (reason instanceof Error) {
    logger.error('Promesa rechazada no manejada', { 
      reason: reason.message,
      stack: reason.stack 
    });
  } else {
    logger.error('Promesa rechazada no manejada con razón desconocida', { reason });
  }
  process.exit(1);
});
