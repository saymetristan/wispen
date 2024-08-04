import express from 'express';
import twilio from 'twilio';
import OpenAIService from '../services/openaiService.js';
import dotenv from 'dotenv';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import userStatusMiddleware from '../middleware/userStatusMiddleware.js';

dotenv.config();

const router = express.Router();

const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

// Función para validar el número de teléfono
const isValidPhoneNumber = (phoneNumber) => {
  // Implementa la lógica de validación según tus necesidades
  return phoneNumber && phoneNumber.startsWith('whatsapp:+');
};

// Función para determinar el tipo de mensaje
const getMessageType = (body) => {
  if (body.NumMedia > 0) {
    return body.MediaContentType0.startsWith('audio/') ? 'audio' : 'image';
  }
  return 'text';
};

router.post('/webhook', express.urlencoded({ extended: false }), twilio.webhook({ validate: false }), userStatusMiddleware, async (req, res) => {
  logger.info('Webhook recibido:', req.body);
  const incomingMsg = req.body.Body;
  const from = req.body.From;
  const waId = req.body.WaId;
  const mediaUrl = req.body.NumMedia > 0 ? req.body.MediaUrl0 : null;
  const mediaType = req.body.MediaContentType0;

  const messageType = getMessageType(req.body);

  try {
    if (!isValidPhoneNumber(from)) {
      throw new Error('Número de teléfono inválido');
    }

    if (messageType === 'image' && req.body.NumMedia > 1) {
      throw new Error('Solo se puede procesar una imagen por mensaje');
    }

    let user = await User.findByPk(waId);
    if (!user) {
      user = await User.create({ 
        id: waId, 
        phoneNumber: from.replace('whatsapp:', ''), 
        name: 'Unknown',
        isNewUser: true,
        isOnboarding: true,  // Añadimos esta línea
        assistant_ID: 'asst_AUZqqVPMNJFedXX3A5fYBp7f' // ID del asistente de onboarding
      });
    }

    const twiml = new twilio.twiml.MessagingResponse();

    let aiResponse;
    switch (messageType) {
      case 'audio':
        aiResponse = await OpenAIService.processVoiceMessage(mediaUrl, waId);
        break;
      case 'image':
        aiResponse = await OpenAIService.processMessage(incomingMsg, waId, mediaUrl);
        break;
      case 'text':
        aiResponse = await OpenAIService.processMessage(incomingMsg, waId);
        break;
      default:
        throw new Error('Tipo de mensaje no soportado');
    }
    twiml.message(aiResponse);

    // Log del assistant_ID y threadId después de procesar el mensaje
    logger.info(`Usuario: ${waId}, Assistant ID: ${user.assistant_ID}, Thread ID: ${user.threadId}`);

    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
    logger.info('Respuesta enviada:', twiml.toString());
  } catch (error) {
    logger.error('Error procesando la solicitud:', error);
    const twiml = new twilio.twiml.MessagingResponse();
    let errorMessage = 'Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo más tarde.';
    
    if (error.message === 'Número de teléfono inválido') {
      errorMessage = 'Lo siento, tu número de teléfono no es válido para este servicio.';
    } else if (error.message === 'Solo se puede procesar una imagen por mensaje') {
      errorMessage = 'Por favor, envía solo una imagen por mensaje.';
    } else if (error.message === 'Tipo de mensaje no soportado') {
      errorMessage = 'Lo siento, no puedo procesar este tipo de mensaje.';
    }

    twiml.message(errorMessage);
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
  }
});

export default router;