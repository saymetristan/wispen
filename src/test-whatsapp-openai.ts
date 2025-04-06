import { ProcessWhatsAppMessage } from './core/usecases/ProcessWhatsAppMessage';
import { logger } from './utils/logger';

/**
 * Script para probar la integración entre WhatsApp y OpenAI
 */
async function testWhatsAppOpenAIIntegration() {
  try {
    // Crear instancia del caso de uso
    const processMessage = new ProcessWhatsAppMessage();
    
    // Simular un número de teléfono (formato internacional)
    const phoneNumber = '5215512345678'; // Ejemplo: número de México
    
    // Mensaje de prueba
    const testMessage = 'Hola, ¿cuál es la mejor manera de llevar un control de gastos?';
    logger.info('Simulando mensaje de WhatsApp', { 
      from: phoneNumber,
      message: testMessage 
    });
    
    // Procesar el mensaje
    logger.info('Procesando mensaje...');
    const response = await processMessage.execute(phoneNumber, testMessage);
    
    // Mostrar la respuesta
    logger.info('Respuesta que se enviaría a WhatsApp:', { response });
    logger.info('Prueba completada exitosamente');
  } catch (error) {
    logger.error('Error durante la prueba de integración WhatsApp-OpenAI', {
      error: (error as Error).message,
      stack: (error as Error).stack
    });
    process.exit(1);
  }
}

// Ejecutar la prueba
testWhatsAppOpenAIIntegration().catch(error => {
  logger.error('Error no manejado', { error: error.message });
  process.exit(1);
}); 