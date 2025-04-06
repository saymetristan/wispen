import { OpenAIClient } from './infrastructure/services/openai/OpenAIClient';
import { OpenAIAssistantService } from './infrastructure/services/openai/OpenAIAssistantService';
import { logger } from './utils/logger';

/**
 * Script simple para probar la integración con OpenAI
 */
async function testOpenAI() {
  try {
    // Probar conexión con OpenAI
    logger.info('Probando conexión con OpenAI...');
    const connected = await OpenAIClient.testConnection();
    
    if (!connected) {
      logger.error('No se pudo conectar con OpenAI');
      process.exit(1);
    }
    
    // Probar la creación de un asistente
    logger.info('Probando creación de asistente...');
    const assistantService = new OpenAIAssistantService();
    const assistantId = await assistantService.getOrCreateAssistant();
    logger.info('Asistente obtenido correctamente', { assistantId });
    
    // Crear un thread de prueba
    logger.info('Creando thread de prueba...');
    const thread = await assistantService.createThread('test-user');
    logger.info('Thread creado correctamente', { threadId: thread.id });
    
    // Enviar un mensaje de prueba
    logger.info('Enviando mensaje al thread...');
    await assistantService.addMessageToThread(thread.id, '¿Cómo puedo ahorrar dinero?');
    
    // Ejecutar el asistente
    logger.info('Ejecutando el asistente...');
    const response = await assistantService.runAssistant(thread.id);
    
    // Mostrar la respuesta
    logger.info('Respuesta del asistente:', { response });
    
    logger.info('Pruebas completadas exitosamente');
  } catch (error) {
    logger.error('Error durante las pruebas de OpenAI', {
      error: (error as Error).message,
      stack: (error as Error).stack
    });
  }
}

// Ejecutar pruebas
testOpenAI().catch(error => {
  logger.error('Error no manejado', { error: error.message });
  process.exit(1);
}); 