import express from 'express';
import twilio from 'twilio';
import OpenAIService from '../services/openaiService.js';
import dotenv from 'dotenv';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import userStatusMiddleware from '../middleware/userStatusMiddleware.js';
import fs from 'fs';

dotenv.config();

const router = express.Router();

const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const client = twilio(accountSid, twilioAuthToken);

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
        assistant_ID: 'asst_4aycqyziNvkiMm88Sf1CvPJg',
        isOnboarding: true
      });

      // Enviar mensajes de bienvenida
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message(`¡hola, humano con billetera! 👋💸 soy wispen, tu nuevo gurú financiero de bolsillo. estoy aquí para transformar tu caos monetario en una sinfonía de centavos:

📝 cuéntame tus gastos e ingresos: mensaje, nota de voz o foto de tus recibos 
📊 pídeme reportes financieros
💡 solicita consejos para que tu dinero trabaje más duro

dame un momento para crear tu perfil de superhéroe financiero. ¡es más rápido que decir "compra impulsiva" 47 veces! 🦸‍♂️💨`);
      res.writeHead(200, {'Content-Type': 'text/xml'});
      res.end(twiml.toString());

      // Esperar 40 segundos antes de enviar el segundo mensaje
      setTimeout(async () => {
        const mensaje2 = `¡boom! tu perfil está listo y enlazado a tu número : *${from.replace('whatsapp:', '')}*.

eres oficialmente parte del club de los financieramente sabios 🧠💰

¿listo para el show? lánzame un gasto o un ingreso. yo me encargo del resto, como un mago financiero, pero sin el sombrero ridículo 🎩✨

recuerda, puedes hablarme, mandarme notas de voz (serenatas financieras bienvenidas), o lanzarme fotos de tus recibos.

¿quieres actualizar tu perfil? solo dilo. soy todo oídos (y unos cuantos chips de ia).

tip: ponle 📌 a nuestra conversación. así me tendrás siempre a la mano 😉`;

        await client.messages.create({
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          body: mensaje2,
          to: from
        });

        // Enviar el tercer mensaje
        const mensaje3 = `🤘💰 gracias por subirte a esta montaña rusa llamada wispen. por tu confianza en nosotros, todas las funciones que ves ahora serán tuyas, gratis, por siempre jamás.

si en el futuro agregamos funciones premium (ya sabes, para mantener a nuestros hamsters generadores de ia bien alimentados), te lo haremos saber.

pero por ahora, disfruta de tu pase vip al mundo de las finanzas inteligentes. ¡eres la nata de nuestro café financiero! ☕💸

atte. el wispen team 🫂🫰`;

        await client.messages.create({
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          body: mensaje3,
          to: from
        });

        // Marcar el onboarding como completado
        user.isOnboarding = false;
        await user.save();
      }, 40000);

      return;
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

    if (typeof aiResponse === 'object' && aiResponse.csvFilePath) {
      // Es un reporte con CSV
      const csvFilePath = aiResponse.csvFilePath;
      
      // Enviar un mensaje de texto informando sobre el reporte
      await client.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        body: 'Aquí tienes tu reporte generado:',
        to: from
      });

      // Enviar el archivo CSV
      await client.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        mediaUrl: [csvFilePath],
        to: from
      });

      // Eliminar el archivo temporal después de enviarlo
      fs.unlink(csvFilePath, (err) => {
        if (err) {
          logger.error('Error al eliminar el archivo temporal:', err);
        }
      });

      logger.info(`Reporte CSV enviado a ${from}`);
      res.sendStatus(200);
    } else if (typeof aiResponse === 'object' && aiResponse.pdfUrl) {
      // Es una respuesta de seguridad con PDF
      try {
        await client.messages.create({
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          body: aiResponse.message,
          to: from
        });
        
        await client.messages.create({
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          mediaUrl: [aiResponse.pdfUrl],
          to: from
        });

        logger.info(`PDF de seguridad enviado a ${from}`);
      } catch (error) {
        logger.error('Error al enviar el PDF de seguridad:', error);
        throw new Error('No se pudo enviar el PDF de seguridad');
      }
    } else {
      twiml.message(aiResponse);
      res.writeHead(200, {'Content-Type': 'text/xml'});
      res.end(twiml.toString());
      logger.info('Respuesta enviada:', twiml.toString());
    }

    // Log del assistant_ID y threadId después de procesar el mensaje
    logger.info(`Usuario: ${waId}, Assistant ID: ${user.assistant_ID}, Thread ID: ${user.threadId}`);
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
    } else if (error.message === 'No se pudo enviar el PDF de seguridad') {
      errorMessage = 'Lo siento, no se pudo enviar el PDF de seguridad.';
    }

    twiml.message(errorMessage);
    if (!res.headersSent) {
      res.writeHead(200, {'Content-Type': 'text/xml'});
      res.end(twiml.toString());
    }
  }
});

export default router;