import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { WhatsAppService } from './infrastructure/services/whatsapp/WhatsAppService';
import { UserOnboardingUseCase } from './core/usecases/user/UserOnboardingUseCase';
import { PrismaRepositoryFactory } from './adapters/factories/PrismaRepositoryFactory';
import { logger } from './utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Script de prueba para simular el flujo de onboarding de un usuario
 */
async function testOnboarding() {
  try {
    logger.info('=== INICIANDO PRUEBA DE ONBOARDING ===');
    
    // Inicializamos Prisma y los servicios necesarios
    const prisma = new PrismaClient();
    const repositoryFactory = new PrismaRepositoryFactory(prisma);
    const userRepository = repositoryFactory.createUserRepository();
    const whatsAppService = new WhatsAppService();
    
    // Creamos el caso de uso de onboarding
    const userOnboardingUseCase = new UserOnboardingUseCase(
      repositoryFactory,
      whatsAppService
    );
    
    // Número de prueba
    const phone = 'whatsapp:5215555555555';
    
    // Verificamos si el usuario ya existe y lo eliminamos para la prueba
    const existingUser = await userRepository.getUserByPhoneNumber(phone);
    
    if (existingUser) {
      logger.info('Eliminando usuario existente para la prueba', { 
        userId: existingUser.id,
        phone 
      });
      await userRepository.deleteUser(existingUser.id);
    }
    
    // Creamos un nuevo usuario de prueba
    const userId = uuidv4();
    const newUser = {
      id: userId,
      phone,
      name: 'Usuario de Prueba',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Guardamos el usuario en la base de datos
    const savedUser = await userRepository.createUser(newUser);
    
    logger.info('Usuario creado para la prueba de onboarding', { 
      userId: savedUser.id,
      phone: savedUser.phone
    });
    
    // Iniciamos el proceso de onboarding
    await userOnboardingUseCase.startOnboarding(savedUser);
    
    logger.info('Proceso de onboarding iniciado, esperando 45 segundos para que se complete...');
    
    // Esperamos a que se complete el onboarding (aprox. 45 segundos)
    await new Promise(resolve => setTimeout(resolve, 45000));
    
    // Verificamos el estado final del usuario
    const finalUser = await userRepository.getUserById(userId);
    
    if (finalUser && finalUser.metadata) {
      logger.info('Estado final del onboarding', { 
        userId: finalUser.id,
        onboarding: finalUser.metadata.onboarding
      });
    } else {
      logger.error('No se pudo obtener el estado final del usuario');
    }
    
    logger.info('=== PRUEBA DE ONBOARDING COMPLETADA ===');
    
    // Cerramos la conexión de Prisma
    await prisma.$disconnect();
    
  } catch (error) {
    logger.error('Error en la prueba de onboarding', {
      error: (error as Error).message
    });
  }
}

// Ejecutamos la prueba
testOnboarding(); 