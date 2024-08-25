import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import { createWriteStream, createReadStream, unlink } from 'fs';
import { promisify } from 'util';
import openai from '../config/openai.js';
import logger from '../utils/logger.js';
import OpenAIService from './openaiService.js';

const unlinkAsync = promisify(unlink);

class VoiceService {
  async processVoiceMessage(mediaUrl, userId) {
    try {
      const response = await axios.get(mediaUrl, {
        responseType: 'stream',
        auth: {
          username: process.env.TWILIO_ACCOUNT_SID,
          password: process.env.TWILIO_AUTH_TOKEN
        }
      });
      const tempFilePath = `/tmp/temp_${uuidv4()}.ogg`;
      const writer = createWriteStream(tempFilePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      const mp3FilePath = tempFilePath.replace('.ogg', '.mp3');
      await new Promise((resolve, reject) => {
        ffmpeg(tempFilePath)
          .toFormat('mp3')
          .on('end', resolve)
          .on('error', reject)
          .save(mp3FilePath);
      });

      const audioFile = createReadStream(mp3FilePath);
      const transcription = await openai.audio.transcriptions.create({
        model: "whisper-1",
        file: audioFile,
        response_format: "text"
      });

      logger.info('Respuesta de transcripción:', transcription);

      if (!transcription) {
        throw new Error('La transcripción está vacía o no se obtuvo correctamente');
      }

      logger.info('Transcripción obtenida:', transcription);

      await unlinkAsync(tempFilePath);
      await unlinkAsync(mp3FilePath);

      return await OpenAIService.processMessage(transcription, userId);
    } catch (error) {
      logger.error('Error al procesar la nota de voz:', error);
      throw error;
    }
  }
}

export default new VoiceService();