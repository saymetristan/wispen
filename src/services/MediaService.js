import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import openai from '../config/openai.js';
import logger from '../utils/logger.js';

class MediaService {
  async uploadImage(mediaUrl) {
    try {
      const response = await axios.get(mediaUrl, {
        responseType: 'arraybuffer',
        auth: {
          username: process.env.TWILIO_ACCOUNT_SID,
          password: process.env.TWILIO_AUTH_TOKEN
        }
      });

      const tempFileName = `temp_${uuidv4()}.jpg`;
      const tempFilePath = path.join('/tmp', tempFileName);

      await fs.promises.writeFile(tempFilePath, response.data);

      const file = await openai.files.create({
        file: fs.createReadStream(tempFilePath),
        purpose: "vision"
      });

      await fs.promises.unlink(tempFilePath);

      return file.id;
    } catch (error) {
      logger.error('Error al subir la imagen a OpenAI:', error);
      throw error;
    }
  }
}

export default new MediaService();