import { OpenAIClient } from './infrastructure/services/openai/OpenAIClient';
import { OpenAIAssistantService } from './infrastructure/services/openai/OpenAIAssistantService';
import { logger } from './utils/logger';
import { env } from './infrastructure/config/env';

/**
 * Script para probar el asistente de OpenAI configurado
 */
async function testConfiguredAssistant() {
  try {
    // Verificar que tenemos el ID del asistente configurado
    if (!env.OPENAI_ASSISTANT_ID) {
      logger.error('No se encontró OPENAI_ASSISTANT_ID en las variables de entorno');
      process.exit(1);
    }
    
    logger.info('ID del asistente configurado:', { assistantId: env.OPENAI_ASSISTANT_ID });
    
    // Probar conexión con OpenAI
    logger.info('Verificando conexión con OpenAI...');
    const connected = await OpenAIClient.testConnection();
    
    if (!connected) {
      logger.error('No se pudo conectar con OpenAI');
      process.exit(1);
    }
    
    // Obtener el asistente existente
    logger.info('Obteniendo el asistente configurado...');
    const assistantService = new OpenAIAssistantService();
    const assistantId = await assistantService.getOrCreateAssistant();
    
    // Verificar que el ID obtenido coincide con el configurado
    if (assistantId !== env.OPENAI_ASSISTANT_ID) {
      logger.warn('El ID obtenido no coincide con el configurado', {
        obtenido: assistantId,
        configurado: env.OPENAI_ASSISTANT_ID
      });
    } else {
      logger.info('Asistente verificado correctamente', { assistantId });
    }
    
    // Crear un thread de prueba
    logger.info('Creando thread de prueba...');
    const thread = await assistantService.createThread('test-user');
    logger.info('Thread creado correctamente', { threadId: thread.id });
    
    // Enviar un mensaje de prueba y obtener respuesta
    const testQuestion = '¿Cuál es la mejor manera de ahorrar dinero para mis vacaciones?';
    logger.info('Enviando pregunta de prueba...', { question: testQuestion });
    await assistantService.addMessageToThread(thread.id, testQuestion);
    
    logger.info('Esperando respuesta del asistente...');
    const response = await assistantService.runAssistant(thread.id);
    
    logger.info('Respuesta del asistente:', { response });
    logger.info('Prueba completada exitosamente');
  } catch (error) {
    logger.error('Error durante la prueba del asistente', {
      error: (error as Error).message,
      stack: (error as Error).stack
    });
    process.exit(1);
  }
}

// Ejecutar la prueba
testConfiguredAssistant().catch(error => {
  logger.error('Error no manejado', { error: error.message });
  process.exit(1);
}); 