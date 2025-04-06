import { UserRepository } from '../domain/repositories/UserRepository';
import { ThreadRepository } from '../domain/repositories/ThreadRepository';
import { OpenAIAssistantService } from '@infrastructure/services/openai/OpenAIAssistantService';
import { RepositoryFactory } from '@infrastructure/database/RepositoryFactory';
import { logger } from '@utils/logger';
import { WhatsAppService } from '@infrastructure/services/whatsapp/WhatsAppService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Caso de uso para procesar mensajes entrantes de WhatsApp
 */
export class ProcessWhatsAppMessage {
  private userRepository: UserRepository;
  private threadRepository: ThreadRepository;
  private openaiAssistantService: OpenAIAssistantService;
  private whatsappService: WhatsAppService;

  constructor() {
    this.userRepository = RepositoryFactory.getUserRepository();
    this.threadRepository = RepositoryFactory.getThreadRepository();
    this.openaiAssistantService = new OpenAIAssistantService();
    this.whatsappService = new WhatsAppService();
  }

  /**
   * Procesa un mensaje entrante de WhatsApp
   * @param phone Número de teléfono del remitente
   * @param message Contenido del mensaje
   */
  async execute(phone: string, message: string): Promise<string> {
    try {
      // 1. Buscar o crear usuario por número de teléfono
      const user = await this.findOrCreateUser(phone);

      // 2. Buscar o crear thread para el usuario
      const thread = await this.threadRepository.findOrCreateByUserId(user.id);

      // 3. Añadir mensaje al thread
      await this.openaiAssistantService.addMessageToThread(thread.id, message);

      // 4. Ejecutar el asistente para obtener respuesta
      const response = await this.openaiAssistantService.runAssistant(thread.id);

      // 5. Devolver la respuesta
      return response;
    } catch (error) {
      logger.error('Error al procesar mensaje de WhatsApp', {
        error: (error as Error).message,
        phone,
      });
      
      // Devolver un mensaje de error genérico
      return '😕 Lo siento, tuve un problema al procesar tu mensaje. ¿Podrías intentarlo de nuevo?';
    }
  }

  /**
   * Busca un usuario por su teléfono o lo crea si no existe
   */
  private async findOrCreateUser(phone: string) {
    // Formatear teléfono (eliminar + si existe)
    const formattedPhone = phone.startsWith('+') ? phone.substring(1) : phone;
    
    // Buscar usuario
    let user = await this.userRepository.findByPhone(formattedPhone);
    
    // Si no existe, crearlo
    if (!user) {
      // Importar la clase User aquí para evitar importaciones circulares
      const { User } = await import('../domain/User');
      
      // Crear nueva instancia con un ID generado con UUID
      const newUser = new User(uuidv4(), formattedPhone);
      user = await this.userRepository.create(newUser);
      
      logger.info('Nuevo usuario creado', { 
        userId: user.id,
        phone: formattedPhone
      });
    }
    
    return user;
  }
} 