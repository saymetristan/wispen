import { UserRepository } from '../../domain/repositories/UserRepository';
import { User } from '../../domain/user/User';
import { WhatsAppService } from '../../../infrastructure/services/whatsapp/WhatsAppService';
import { logger } from '../../../utils/logger';
import { RepositoryFactory } from '../../domain/factories/RepositoryFactory';

/**
 * Metadata para seguimiento del proceso de onboarding
 */
interface OnboardingMetadata {
  status: OnboardingStatus;
  startedAt: string;
  completedAt?: string;
}

/**
 * Estados posibles durante el proceso de onboarding
 */
export enum OnboardingStatus {
  STARTED = 'started',
  PROFILE_CREATED = 'profile_created',
  COMPLETED = 'completed'
}

/**
 * Caso de uso para gestionar el proceso de onboarding de nuevos usuarios
 */
export class UserOnboardingUseCase {
  private userRepository: UserRepository;
  private whatsAppService: WhatsAppService;

  // Mensajes para el proceso de onboarding
  private readonly WELCOME_MESSAGE = '¡hola, humano con billetera! 👋💸 soy wispen, tu nuevo gurú financiero de bolsillo. estoy aquí para transformar tu caos monetario en una sinfonía de centavos:\n\n📝 cuéntame tus gastos e ingresos: mensaje, nota de voz o foto de tus recibos \n📊 pídeme reportes financieros\n💡 solicita consejos para que tu dinero trabaje más duro\n\ndame un momento para crear tu perfil de superhéroe financiero. ¡es más rápido que decir "compra impulsiva" 47 veces! 🦸‍♂️💨';
  
  private readonly PROFILE_CREATION_MESSAGE = (phone: string) => 
    `¡boom! tu perfil está listo y enlazado a tu número : *${phone.replace('whatsapp:', '')}*.\n\neres oficialmente parte del club de los financieramente sabios 🧠💰\n\n¿listo para el show? lánzame un gasto o un ingreso. yo me encargo del resto, como un mago financiero, pero sin el sombrero ridículo 🎩✨\n\nrecuerda, puedes hablarme, mandarme notas de voz (serenatas financieras bienvenidas), o lanzarme fotos de tus recibos.\n\n¿quieres actualizar tu perfil? solo dilo. soy todo oídos (y unos cuantos chips de ia).\n\ntip: ponle 📌 a nuestra conversación. así me tendrás siempre a la mano 😉`;
  
  private readonly COMPLETION_MESSAGE = '🤘💰 gracias por subirte a esta montaña rusa llamada wispen. por tu confianza en nosotros, todas las funciones que ves ahora serán tuyas, gratis, por siempre jamás.\n\nsi en el futuro agregamos funciones premium (ya sabes, para mantener a nuestros hamsters generadores de ia bien alimentados), te lo haremos saber.\n\npero por ahora, disfruta de tu pase vip al mundo de las finanzas inteligentes. ¡eres la nata de nuestro café financiero! ☕💸\n\natte. el wispen team 🫂🫰';

  /**
   * Constructor
   */
  constructor(
    repositoryFactory: RepositoryFactory,
    whatsAppService: WhatsAppService
  ) {
    this.userRepository = repositoryFactory.createUserRepository();
    this.whatsAppService = whatsAppService;
  }

  /**
   * Inicia el proceso de onboarding para un usuario
   * @param user Usuario al que se iniciará el onboarding
   */
  async startOnboarding(user: User): Promise<void> {
    try {
      logger.info('Iniciando proceso de onboarding', { userId: user.id, phone: user.phone });

      // Preparar metadata para seguimiento del onboarding
      const onboardingMetadata: OnboardingMetadata = {
        status: OnboardingStatus.STARTED,
        startedAt: new Date().toISOString()
      };

      // Guardar metadata de onboarding en el usuario
      await this.userRepository.updateUserMetadata(user.id, { 
        onboarding: onboardingMetadata 
      });

      // Enviar mensaje de bienvenida
      await this.whatsAppService.sendTextMessage(user.phone, this.WELCOME_MESSAGE);
      
      // Programar envío del mensaje de creación de perfil (15 segundos después)
      setTimeout(() => {
        this.sendProfileCreationMessage(user)
          .catch(error => logger.error('Error al enviar mensaje de creación de perfil', { 
            error: error.message, 
            userId: user.id 
          }));
      }, 15000);

      logger.info('Mensaje de bienvenida enviado', { userId: user.id });
    } catch (error) {
      logger.error('Error al iniciar onboarding', { 
        error: (error as Error).message, 
        userId: user.id
      });
      throw error;
    }
  }

  /**
   * Envía el mensaje de creación de perfil y actualiza el estado
   */
  private async sendProfileCreationMessage(user: User): Promise<void> {
    try {
      logger.info('Enviando mensaje de creación de perfil', { userId: user.id });

      // Obtener metadata actual
      const currentUser = await this.userRepository.getUserById(user.id);
      if (!currentUser) {
        throw new Error(`Usuario no encontrado: ${user.id}`);
      }

      const metadata = currentUser.metadata || {};
      const onboarding = metadata.onboarding || {
        status: OnboardingStatus.STARTED,
        startedAt: new Date().toISOString()
      };

      // Actualizar estado de onboarding
      onboarding.status = OnboardingStatus.PROFILE_CREATED;
      
      // Guardar nuevo estado
      await this.userRepository.updateUserMetadata(user.id, { 
        onboarding 
      });

      // Enviar mensaje
      await this.whatsAppService.sendTextMessage(user.phone, this.PROFILE_CREATION_MESSAGE(user.phone));
      
      // Programar finalización del onboarding (30 segundos después)
      setTimeout(() => {
        this.completeOnboarding(user)
          .catch(error => logger.error('Error al completar onboarding', { 
            error: error.message, 
            userId: user.id 
          }));
      }, 30000);

      logger.info('Mensaje de creación de perfil enviado', { userId: user.id });
    } catch (error) {
      logger.error('Error al enviar mensaje de creación de perfil', { 
        error: (error as Error).message, 
        userId: user.id
      });
      throw error;
    }
  }

  /**
   * Completa el proceso de onboarding
   */
  private async completeOnboarding(user: User): Promise<void> {
    try {
      logger.info('Completando proceso de onboarding', { userId: user.id });

      // Obtener metadata actual
      const currentUser = await this.userRepository.getUserById(user.id);
      if (!currentUser) {
        throw new Error(`Usuario no encontrado: ${user.id}`);
      }

      const metadata = currentUser.metadata || {};
      const onboarding = metadata.onboarding || {};

      // Actualizar estado de onboarding
      onboarding.status = OnboardingStatus.COMPLETED;
      onboarding.completedAt = new Date().toISOString();
      
      // Guardar nuevo estado
      await this.userRepository.updateUserMetadata(user.id, { 
        onboarding 
      });

      // Enviar mensaje final
      await this.whatsAppService.sendTextMessage(user.phone, this.COMPLETION_MESSAGE);

      logger.info('Onboarding completado exitosamente', { userId: user.id });
    } catch (error) {
      logger.error('Error al completar onboarding', { 
        error: (error as Error).message, 
        userId: user.id
      });
      throw error;
    }
  }

  /**
   * Verifica si un usuario está en proceso de onboarding
   */
  async isInOnboarding(userId: string): Promise<boolean> {
    try {
      const user = await this.userRepository.getUserById(userId);
      
      if (!user || !user.metadata) {
        return false;
      }

      const onboarding = user.metadata.onboarding;
      if (!onboarding) {
        return false;
      }

      // El usuario está en onboarding si no ha completado el proceso
      return onboarding.status !== OnboardingStatus.COMPLETED;
    } catch (error) {
      logger.error('Error al verificar estado de onboarding', { 
        error: (error as Error).message, 
        userId
      });
      return false;
    }
  }
} 