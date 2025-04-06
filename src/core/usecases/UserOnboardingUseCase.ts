import { RepositoryFactory } from '@infrastructure/database/RepositoryFactory';
import { UserRepository } from '@core/domain/repositories/UserRepository';
import { User } from '@core/domain/User';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@utils/logger';
import { ThreadRepository } from '@core/domain/repositories/ThreadRepository';
import { WhatsAppService } from '@infrastructure/services/whatsapp/WhatsAppService';

/**
 * Estados de onboarding del usuario
 */
export enum OnboardingStatus {
  INITIAL = 'initial',            // Estado inicial
  PROFILE_CREATED = 'profile_created',  // Perfil creado
  WELCOME_SENT = 'welcome_sent',      // Mensaje de bienvenida enviado
  PROFILE_CONFIRMATION_SENT = 'profile_confirmation_sent', // Confirmación de perfil
  COMPLETED = 'completed',          // Onboarding completado
}

/**
 * Caso de uso para manejar el onboarding de usuarios
 */
export class UserOnboardingUseCase {
  private userRepository: UserRepository;
  private threadRepository: ThreadRepository;
  private whatsappService: WhatsAppService;
  
  // Mensajes predefinidos para el onboarding
  private readonly WELCOME_MESSAGE = '¡hola, humano con billetera! 👋💸 soy wispen, tu nuevo gurú financiero de bolsillo. estoy aquí para transformar tu caos monetario en una sinfonía de centavos:\n\n📝 cuéntame tus gastos e ingresos: mensaje, nota de voz o foto de tus recibos \n📊 pídeme reportes financieros\n💡 solicita consejos para que tu dinero trabaje más duro\n\ndame un momento para crear tu perfil de superhéroe financiero. ¡es más rápido que decir "compra impulsiva" 47 veces! 🦸‍♂️💨';
  
  private readonly PROFILE_CREATED_MESSAGE = (phone: string) => `¡boom! tu perfil está listo y enlazado a tu número : *${phone.replace('whatsapp:', '')}*.\n\neres oficialmente parte del club de los financieramente sabios 🧠💰\n\n¿listo para el show? lánzame un gasto o un ingreso. yo me encargo del resto, como un mago financiero, pero sin el sombrero ridículo 🎩✨\n\nrecuerda, puedes hablarme, mandarme notas de voz (serenatas financieras bienvenidas), o lanzarme fotos de tus recibos.\n\n¿quieres actualizar tu perfil? solo dilo. soy todo oídos (y unos cuantos chips de ia).\n\ntip: ponle 📌 a nuestra conversación. así me tendrás siempre a la mano 😉`;
  
  private readonly FINAL_MESSAGE = '🤘💰 gracias por subirte a esta montaña rusa llamada wispen. por tu confianza en nosotros, todas las funciones que ves ahora serán tuyas, gratis, por siempre jamás.\n\nsi en el futuro agregamos funciones premium (ya sabes, para mantener a nuestros hamsters generadores de ia bien alimentados), te lo haremos saber.\n\npero por ahora, disfruta de tu pase vip al mundo de las finanzas inteligentes. ¡eres la nata de nuestro café financiero! ☕💸\n\natte. el wispen team 🫂🫰';
  
  constructor() {
    this.userRepository = RepositoryFactory.getUserRepository();
    this.threadRepository = RepositoryFactory.getThreadRepository();
    this.whatsappService = new WhatsAppService();
  }

  /**
   * Inicia el proceso de onboarding para un nuevo usuario
   * @param phone Número de teléfono del usuario
   * @returns Usuario creado
   */
  async startOnboarding(phone: string): Promise<User> {
    try {
      logger.info('Iniciando proceso de onboarding', { phone });
      
      // Verificar si el usuario ya existe
      const existingUser = await this.userRepository.findByPhone(this.formatPhoneNumber(phone));
      
      if (existingUser) {
        logger.info('Usuario ya existe, omitiendo onboarding', { 
          userId: existingUser.id, 
          phone 
        });
        return existingUser;
      }
      
      // Enviar mensaje de bienvenida
      await this.whatsappService.sendTextMessage(phone, this.WELCOME_MESSAGE);
      
      // Crear nuevo usuario
      const newUser = new User(
        uuidv4(),
        this.formatPhoneNumber(phone),
        null,
        new Date(),
        new Date()
      );
      
      // Guardar metadatos de onboarding
      newUser.updateMetadata({
        onboardingStatus: OnboardingStatus.INITIAL,
        onboardingStartedAt: new Date().toISOString()
      });
      
      // Persistir el usuario
      const savedUser = await this.userRepository.create(newUser);
      
      logger.info('Usuario creado para onboarding', { 
        userId: savedUser.id, 
        phone 
      });
      
      // Programar el segundo mensaje después de 40 segundos
      setTimeout(async () => {
        await this.sendProfileCreatedMessage(savedUser, phone);
      }, 40000);
      
      return savedUser;
    } catch (error) {
      logger.error('Error durante el inicio de onboarding', {
        error: (error as Error).message,
        phone
      });
      throw error;
    }
  }
  
  /**
   * Envía el mensaje de perfil creado y actualiza el estado de onboarding
   */
  private async sendProfileCreatedMessage(user: User, phone: string): Promise<void> {
    try {
      // Enviar mensaje de perfil creado
      await this.whatsappService.sendTextMessage(phone, this.PROFILE_CREATED_MESSAGE(phone));
      
      // Actualizar estado de onboarding
      user.updateMetadata({
        ...user.metadata,
        onboardingStatus: OnboardingStatus.PROFILE_CONFIRMATION_SENT,
        profileCreatedAt: new Date().toISOString()
      });
      
      // Persistir cambios
      await this.userRepository.update(user);
      
      logger.info('Mensaje de perfil creado enviado', { 
        userId: user.id, 
        phone 
      });
      
      // Programar mensaje final inmediatamente después
      setTimeout(async () => {
        await this.sendFinalMessage(user, phone);
      }, 1000);
    } catch (error) {
      logger.error('Error al enviar mensaje de perfil creado', {
        error: (error as Error).message,
        userId: user.id,
        phone
      });
    }
  }
  
  /**
   * Envía el mensaje final de onboarding y completa el proceso
   */
  private async sendFinalMessage(user: User, phone: string): Promise<void> {
    try {
      // Enviar mensaje final
      await this.whatsappService.sendTextMessage(phone, this.FINAL_MESSAGE);
      
      // Actualizar estado de onboarding
      user.updateMetadata({
        ...user.metadata,
        onboardingStatus: OnboardingStatus.COMPLETED,
        onboardingCompletedAt: new Date().toISOString()
      });
      
      // Persistir cambios
      await this.userRepository.update(user);
      
      logger.info('Onboarding completado exitosamente', { 
        userId: user.id, 
        phone 
      });
    } catch (error) {
      logger.error('Error al enviar mensaje final de onboarding', {
        error: (error as Error).message,
        userId: user.id,
        phone
      });
    }
  }
  
  /**
   * Verifica si el usuario está en proceso de onboarding
   * @param userId ID del usuario
   * @returns true si está en onboarding, false si no
   */
  async isInOnboarding(userId: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        return false;
      }
      
      const status = user.metadata?.onboardingStatus;
      
      // Si no tiene estado o ya está completado, no está en onboarding
      return !!status && status !== OnboardingStatus.COMPLETED;
    } catch (error) {
      logger.error('Error al verificar estado de onboarding', {
        error: (error as Error).message,
        userId
      });
      return false;
    }
  }
  
  /**
   * Formatea un número de teléfono eliminando caracteres no numéricos
   */
  private formatPhoneNumber(phone: string): string {
    // Eliminar 'whatsapp:' si existe
    const cleanPhone = phone.replace('whatsapp:', '');
    
    // Eliminar todos los caracteres que no sean números
    return cleanPhone.replace(/\D/g, '');
  }
} 