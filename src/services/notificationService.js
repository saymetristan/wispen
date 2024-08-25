import UserService from './UserService.js';
import WhatsAppService from './whatsappService.js';
import logger from '../utils/logger.js';

class NotificationService {
  async enviarAlerta(userId, mensaje) {
    const user = await UserService.findUserById(userId);
    await WhatsAppService.sendMessage(user.phoneNumber, mensaje);
  }
}

export default new NotificationService();