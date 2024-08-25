import MediaService from './MediaService.js';
import openai from '../config/openai.js';
import logger from '../utils/logger.js';

class MessageProcessingService {
  async processContent(message, mediaUrl) {
    const content = [];

    if (message) {
      content.push({
        type: "text",
        text: message
      });
    }

    if (mediaUrl) {
      const fileId = await MediaService.uploadImage(mediaUrl);
      content.push({
        type: "image_file",
        image_file: { file_id: fileId }
      });
    }

    if (content.length === 0) {
      throw new Error('No se proporcionó contenido para el mensaje');
    }

    return content;
  }

  async createMessage(threadId, content) {
    await openai.beta.threads.messages.create(
      threadId,
      {
        role: "user",
        content: content
      }
    );
  }
}

export default new MessageProcessingService();