import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { WhatsAppService } from './infrastructure/services/whatsapp/WhatsAppService';
import { OpenAIAssistantService } from './infrastructure/services/openai/OpenAIAssistantService';
import { OpenAIClient } from './infrastructure/services/openai/OpenAIClient';
import { UserOnboardingUseCase } from './core/usecases/user/UserOnboardingUseCase';
import { ProcessWhatsAppMessage } from './core/usecases/ProcessWhatsAppMessage';
import { PrismaRepositoryFactory } from './adapters/factories/PrismaRepositoryFactory';
import { logger } from './utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { User } from './core/domain/user/User';

/**
 * Script para simular la recepción y procesamiento de un mensaje de WhatsApp, 
 * incluyendo el flujo de onboarding si es un usuario nuevo.
 */
async function testWhatsAppOnboarding() {
  try {
    logger.info('=== INICIANDO PRUEBA DE WHATSAPP CON ONBOARDING ===');
    
    // Inicializar servicios y repositorios
    const prisma = new PrismaClient();
    const repositoryFactory = new PrismaRepositoryFactory(prisma);
    const userRepository = repositoryFactory.createUserRepository();
    
    // Cargar configuración desde variables de entorno
    const config = {
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        assistantId: process.env.OPENAI_ASSISTANT_ID || ''
      }
    };
    
    // Crear servicios
    const whatsAppService = new WhatsAppService();
    const openAIClient = new OpenAIClient(config.openai.apiKey);
    const openAIAssistantService = new OpenAIAssistantService(openAIClient, config.openai.assistantId);
    
    // Crear caso de uso de onboarding
    const userOnboardingUseCase = new UserOnboardingUseCase(
      repositoryFactory,
      whatsAppService
    );
    
    // Crear caso de uso de procesamiento de mensajes
    const processMessageUseCase = new ProcessWhatsAppMessage(
      repositoryFactory,
      whatsAppService,
      openAIAssistantService,
      userOnboardingUseCase
    );
    
    // PARTE 1: Configurar un usuario de prueba
    const phoneNumber = 'whatsapp:5215512345678';
    const testMessage = 'Hola, soy un nuevo usuario';
    
    // Verificar si el usuario ya existe
    logger.info('Buscando usuario con número de teléfono', { phoneNumber });
    let testUser = await userRepository.getUserByPhoneNumber(phoneNumber);
    
    // Si existe, lo eliminamos para la prueba
    if (testUser) {
      logger.info('Eliminando usuario existente para prueba limpia', { 
        userId: testUser.id,
        phoneNumber: testUser.phoneNumber
      });
      await userRepository.deleteUser(testUser.id);
      testUser = null;
    }
    
    // PARTE 2: Simular la recepción de un mensaje de WhatsApp
    logger.info('Simulando recepción de mensaje de WhatsApp', {
      from: phoneNumber,
      message: testMessage
    });
    
    // Procesar el mensaje (esto debería crear un nuevo usuario e iniciar onboarding)
    const result = await processMessageUseCase.execute({
      phoneNumber,
      message: testMessage,
      userName: 'Usuario de Prueba'
    });
    
    logger.info('Resultado del procesamiento del mensaje', { result });
    
    // PARTE 3: Comprobar que se inició el onboarding
    // Obtener el usuario creado
    const newUser = await userRepository.getUserByPhoneNumber(phoneNumber);
    
    if (!newUser) {
      throw new Error('No se creó el usuario correctamente');
    }
    
    logger.info('Usuario creado/recuperado correctamente', {
      userId: newUser.id,
      phoneNumber: newUser.phoneNumber,
      metadata: newUser.metadata
    });
    
    // Verificar si está en onboarding
    const isInOnboarding = await userOnboardingUseCase.isInOnboarding(newUser.id);
    
    logger.info('Estado de onboarding del usuario', {
      userId: newUser.id,
      isInOnboarding,
      metadata: newUser.metadata
    });
    
    // PARTE 4: Esperar a que avance el onboarding
    logger.info('Esperando 45 segundos para que avance el onboarding...');
    await new Promise(resolve => setTimeout(resolve, 45000));
    
    // Verificar el estado final
    const finalUser = await userRepository.getUserById(newUser.id);
    
    if (finalUser && finalUser.metadata) {
      logger.info('Estado final del onboarding', {
        userId: finalUser.id,
        metadata: finalUser.metadata
      });
    } else {
      logger.error('No se pudo obtener el usuario o sus metadatos');
    }
    
    // PARTE 5: Probar enviar un mensaje después del onboarding
    logger.info('Enviando un mensaje después del onboarding');
    
    const postOnboardingResult = await processMessageUseCase.execute({
      phoneNumber,
      message: '¿Cuál es mi balance actual?'
    });
    
    logger.info('Resultado del procesamiento del mensaje post-onboarding', { 
      result: postOnboardingResult 
    });
    
    logger.info('=== PRUEBA DE WHATSAPP CON ONBOARDING COMPLETADA ===');
    
    // Cerrar conexiones
    await prisma.$disconnect();
    
  } catch (error) {
    logger.error('Error en la prueba de WhatsApp con onboarding', {
      error: (error as Error).message,
      stack: (error as Error).stack
    });
  }
}

// Ejecutar la prueba
testWhatsAppOnboarding(); 