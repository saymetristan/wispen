import { OpenAIClient } from './infrastructure/services/openai/OpenAIClient';
import { OpenAIAssistantService } from './infrastructure/services/openai/OpenAIAssistantService';
import { logger } from './utils/logger';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

/**
 * Script simple para probar la integración con OpenAI
 */
async function testOpenAI() {
  // Inicializar PrismaClient
  const prisma = new PrismaClient();
  
  try {
    // Probar conexión con OpenAI
    logger.info('Probando conexión con OpenAI...');
    const connected = await OpenAIClient.testConnection();
    
    if (!connected) {
      logger.error('No se pudo conectar con OpenAI. Verifica tu API key y conexión a internet.');
      process.exit(1);
    }
    
    // Probar la creación de un asistente
    logger.info('Probando creación de asistente...');
    const openAIClient = new OpenAIClient();
    const assistantService = new OpenAIAssistantService(
      openAIClient, 
      process.env.OPENAI_ASSISTANT_ID || null,
      prisma
    );
    
    const assistantId = await assistantService.getOrCreateAssistant();
    logger.info('Asistente obtenido correctamente', { assistantId });
    
    // Crear un usuario de prueba para el test
    const userId = `test-user-${Date.now()}`;
    const userPhone = `whatsapp:12345${Date.now() % 10000}`;
    
    logger.info('Creando usuario de prueba...', { userId, userPhone });
    
    // Crear usuario en la base de datos
    await prisma.user.create({
      data: {
        id: userId,
        phone: userPhone,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {}
      }
    });
    
    logger.info('Usuario creado correctamente', { userId });
    
    // Crear un thread para el usuario de prueba
    logger.info('Creando thread para usuario de prueba...', { userId });
    
    // Enviar un mensaje de prueba mediante el servicio
    const thread = await assistantService.findOrCreateThread(userId);
    logger.info('Thread creado correctamente', { threadId: thread.threadId });
    
    // Enviar un mensaje de prueba
    logger.info('Enviando mensaje al asistente...');
    const response = await assistantService.processMessage(userId, '¿Cómo puedo ahorrar dinero?');
    
    // Mostrar la respuesta
    logger.info('Respuesta del asistente:', { response });
    
    // Limpiar datos de prueba
    logger.info('Limpiando datos de prueba...');
    await prisma.thread.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    
    logger.info('Pruebas completadas exitosamente');
  } catch (error) {
    logger.error('Error durante las pruebas de OpenAI', {
      error: (error as Error).message,
      stack: (error as Error).stack
    });
    process.exit(1);
  } finally {
    // Cerrar la conexión a Prisma
    await prisma.$disconnect();
  }
}

// Ejecutar pruebas
testOpenAI().catch(error => {
  logger.error('Error no manejado', { error: error.message });
  process.exit(1);
}); 