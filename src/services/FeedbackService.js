import axios from 'axios';
import logger from '../utils/logger.js';
import UserService from './UserService.js';

class FeedbackService {
  async processFeedback(feedbackMessage, userId) {
    logger.info(`Procesando feedback: ${feedbackMessage} para el usuario ${userId}`);
    const user = await UserService.findUserById(userId);

    const webhookUrl = 'https://discord.com/api/webhooks/1272776181724483624/zv_VQDyB2HVawkIJmnCV0zxjkr7N1F95G9FAf5futNalDojrPr9GQZsVQO2MFNArRvlc';

    const feedbackData = {
      content: `Feedback de usuario ${user.phoneNumber}:\n${feedbackMessage}`
    };

    try {
      const response = await axios.post(webhookUrl, feedbackData);
      logger.info(`Feedback enviado a Discord. Respuesta: ${response.status}`);
      return '¡gracias por compartir tu opinión! 🙏 tu feedback es como el café para nuestro cerebro financiero: nos mantiene despiertos y en constante mejora. ☕💡';
    } catch (error) {
      logger.error('Error al enviar feedback a Discord:', error);
      throw new Error('No se pudo procesar el feedback en este momento');
    }
  }
}

export default new FeedbackService();