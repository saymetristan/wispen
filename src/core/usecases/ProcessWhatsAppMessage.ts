import { WhatsAppService } from '../../infrastructure/services/whatsapp/WhatsAppService';
import { OpenAIAssistantService } from '../../infrastructure/services/openai/OpenAIAssistantService';
import { RepositoryFactory } from '../domain/factories/RepositoryFactory';
import { UserRepository } from '../domain/repositories/UserRepository';
import { ThreadRepository } from '../domain/repositories/ThreadRepository';
import { User } from '../domain/user/User';
import { Thread } from '../domain/openai/Thread';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { UserOnboardingUseCase } from './user/UserOnboardingUseCase';

interface ProcessMessageRequest {
  phoneNumber: string;
  message: string;
  userName?: string;
}

interface ProcessMessageResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Caso de uso para procesar un mensaje de WhatsApp y generar una respuesta
 */
export class ProcessWhatsAppMessage {
  private userRepository: UserRepository;
  private threadRepository: ThreadRepository;
  private whatsAppService: WhatsAppService;
  private openAIAssistantService: OpenAIAssistantService;
  private userOnboardingUseCase: UserOnboardingUseCase;

  constructor(
    repositoryFactory: RepositoryFactory,
    whatsAppService: WhatsAppService,
    openAIAssistantService: OpenAIAssistantService,
    userOnboardingUseCase: UserOnboardingUseCase
  ) {
    this.userRepository = repositoryFactory.createUserRepository();
    this.threadRepository = repositoryFactory.createThreadRepository();
    this.whatsAppService = whatsAppService;
    this.openAIAssistantService = openAIAssistantService;
    this.userOnboardingUseCase = userOnboardingUseCase;
  }

  /**
   * Procesa un mensaje de WhatsApp y genera una respuesta
   * @param phone Número de teléfono del usuario (con código de país)
   * @param message Mensaje enviado por el usuario
   * @returns Respuesta generada para el usuario
   */
  async execute(request: ProcessMessageRequest): Promise<ProcessMessageResponse> {
    const { phoneNumber, message, userName } = request;
    
    try {
      logger.info('Procesando mensaje de WhatsApp', {
        phoneNumber,
        messageLength: message.length
      });

      // Formatear número de teléfono
      const formattedPhoneNumber = this.formatPhoneNumber(phoneNumber);

      // Buscar o crear usuario
      const user = await this.findOrCreateUser(formattedPhoneNumber, userName);
      
      // Verificar si el usuario está en proceso de onboarding
      const isInOnboarding = await this.userOnboardingUseCase.isInOnboarding(user.id);
      
      // Si está en onboarding, no procesamos el mensaje
      if (isInOnboarding) {
        logger.info('Usuario en proceso de onboarding, ignorando mensaje', {
          userId: user.id,
          phoneNumber: formattedPhoneNumber
        });
        
        return {
          success: true,
          message: 'Usuario en proceso de onboarding'
        };
      }

      // Buscar o crear thread
      const thread = await this.findOrCreateThread(user);

      // Enviar mensaje a OpenAI
      const assistantResponse = await this.openAIAssistantService.sendMessage(thread.threadId, message);

      // Enviar respuesta de vuelta a WhatsApp
      await this.whatsAppService.sendTextMessage(formattedPhoneNumber, assistantResponse);

      logger.info('Mensaje procesado correctamente', {
        userId: user.id,
        threadId: thread.threadId,
        responseLength: assistantResponse.length
      });

      return {
        success: true,
        message: 'Mensaje procesado correctamente'
      };
    } catch (error) {
      logger.error('Error al procesar mensaje de WhatsApp', {
        phoneNumber,
        error: (error as Error).message
      });

      // Intentar enviar mensaje de error al usuario
      try {
        const formattedPhone = this.formatPhoneNumber(phoneNumber);
        await this.whatsAppService.sendTextMessage(
          formattedPhone,
          'Lo siento, tuve un problema al procesar tu mensaje. Por favor, intenta de nuevo más tarde.'
        );
      } catch (sendError) {
        logger.error('Error al enviar mensaje de error', {
          error: (sendError as Error).message
        });
      }

      return {
        success: false,
        error: 'Error al procesar mensaje'
      };
    }
  }

  /**
   * Busca o crea un usuario por su número de teléfono
   */
  private async findOrCreateUser(phoneNumber: string, userName?: string): Promise<User> {
    try {
      // Buscar usuario existente
      let user = await this.userRepository.getUserByPhoneNumber(phoneNumber);

      // Si no existe, crearlo
      if (!user) {
        logger.info('Creando nuevo usuario', { phoneNumber });
        
        const newUser: User = {
          id: uuidv4(),
          phone: phoneNumber,
          name: userName || undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        user = await this.userRepository.createUser(newUser);
        
        // Iniciar proceso de onboarding para el nuevo usuario
        await this.userOnboardingUseCase.startOnboarding(user);
      }

      return user;
    } catch (error) {
      logger.error('Error al buscar/crear usuario', {
        phoneNumber,
        error: (error as Error).message
      });
      throw new Error(`No se pudo encontrar/crear usuario para ${phoneNumber}`);
    }
  }

  /**
   * Busca o crea un thread para un usuario
   */
  private async findOrCreateThread(user: User): Promise<Thread> {
    try {
      // Buscar thread existente
      let thread = await this.threadRepository.getThreadByUserId(user.id);

      // Si no existe, crearlo
      if (!thread) {
        logger.info('Creando nuevo thread para usuario', { userId: user.id });
        
        const threadId = await this.openAIAssistantService.createThread();
        
        const newThread = new Thread(
          uuidv4(),
          user.id,
          threadId,
          { created_by: 'process_whatsapp_message' }
        );

        thread = await this.threadRepository.createThread(newThread);
      }

      return thread;
    } catch (error) {
      logger.error('Error al buscar/crear thread', {
        userId: user.id,
        error: (error as Error).message
      });
      throw new Error(`No se pudo encontrar/crear thread para usuario ${user.id}`);
    }
  }

  /**
   * Formatea un número de teléfono para uso con WhatsApp API
   */
  private formatPhoneNumber(phone: string): string {
    // Si tiene prefijo de WhatsApp, eliminarlo
    let formattedPhone = phone.replace('whatsapp:', '');
    
    // Eliminar caracteres no numéricos
    formattedPhone = formattedPhone.replace(/\D/g, '');
    
    return formattedPhone;
  }
} 