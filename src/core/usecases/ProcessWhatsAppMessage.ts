import { RepositoryFactory } from '@infrastructure/database/RepositoryFactory';
import { UserRepository } from '@core/domain/repositories/UserRepository';
import { User } from '@core/domain/User';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@utils/logger';
import { OpenAIAssistantService } from '@infrastructure/services/openai/OpenAIAssistantService';

/**
 * Caso de uso para procesar un mensaje de WhatsApp y generar una respuesta
 */
export class ProcessWhatsAppMessage {
  private userRepository: UserRepository;
  private openAIAssistantService: OpenAIAssistantService;

  constructor() {
    this.userRepository = RepositoryFactory.getUserRepository();
    this.openAIAssistantService = new OpenAIAssistantService();
  }

  /**
   * Procesa un mensaje de WhatsApp y genera una respuesta
   * @param phone Número de teléfono del usuario (con código de país)
   * @param message Mensaje enviado por el usuario
   * @returns Respuesta generada para el usuario
   */
  async execute(phone: string, message: string): Promise<string> {
    try {
      logger.info('Procesando mensaje de WhatsApp', {
        phone,
        messageLength: message.length
      });

      // Encontrar o crear el usuario
      const user = await this.findOrCreateUser(phone);
      
      // Procesar el mensaje con el asistente de OpenAI
      const response = await this.openAIAssistantService.processMessage(user.id, message);
      
      logger.info('Mensaje procesado correctamente', {
        userId: user.id,
        phone
      });

      return response;
    } catch (error) {
      logger.error('Error al procesar mensaje de WhatsApp', {
        error: (error as Error).message,
        phone
      });

      // Respuesta por defecto en caso de error
      return 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo más tarde.';
    }
  }

  /**
   * Encuentra o crea un usuario por su número de teléfono
   */
  private async findOrCreateUser(phone: string): Promise<User> {
    // Formatear el número de teléfono (eliminar espacios, guiones, etc.)
    const formattedPhone = this.formatPhoneNumber(phone);
    
    // Buscar el usuario por teléfono
    const existingUser = await this.userRepository.findByPhone(formattedPhone);
    
    if (existingUser) {
      return existingUser;
    }
    
    // Si no existe, crear un nuevo usuario
    logger.info('Creando nuevo usuario', { phone: formattedPhone });
    
    const newUser = new User(uuidv4(), formattedPhone);
    
    // Guardar en la base de datos
    const savedUser = await this.userRepository.save(newUser);
    
    logger.info('Usuario creado correctamente', {
      userId: savedUser.id,
      phone: formattedPhone
    });
    
    return savedUser;
  }
  
  /**
   * Formatea un número de teléfono eliminando caracteres no numéricos
   */
  private formatPhoneNumber(phone: string): string {
    // Eliminar todos los caracteres que no sean números
    return phone.replace(/\D/g, '');
  }
} 