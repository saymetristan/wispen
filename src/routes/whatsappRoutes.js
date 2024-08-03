import express from 'express';
import twilio from 'twilio';
import OpenAIService from '../services/openaiService.js';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const router = express.Router();

const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

console.log('Twilio Auth Token:', twilioAuthToken);

router.post('/webhook', express.urlencoded({ extended: false }), twilio.webhook({ validate: false }), async (req, res) => {
  console.log('Webhook recibido:', req.body);
  const incomingMsg = req.body.Body;
  const from = req.body.From;
  const waId = req.body.WaId;
  const mediaUrl = req.body.NumMedia > 0 ? req.body.MediaUrl0 : null;
  const mediaType = req.body.MediaContentType0;

  console.log('Mensaje recibido:', incomingMsg);
  console.log('De:', from);
  console.log('WaId:', waId);
  console.log('Media URL:', mediaUrl);

  try {
    if (!incomingMsg && !mediaUrl) {
      console.log('Cuerpo de la solicitud:', req.body);
      res.status(400).send('No se recibió ningún mensaje ni imagen');
      return;
    }

    let user = await User.findByPk(waId);
    if (!user) {
      user = await User.create({ 
        id: waId, 
        phoneNumber: from.replace('whatsapp:', ''), 
        name: 'Unknown',
        isNewUser: true
      });
    }

    const twiml = new twilio.twiml.MessagingResponse();

    if (user.isNewUser) {
      // Enviar mensaje de bienvenida
      const welcomeMessage = `¡Hola! 👋 Bienvenido a Wispen, tu asistente financiero personal en WhatsApp. 🤖💰

Estoy aquí para ayudarte a manejar tus finanzas de forma fácil y divertida. 🎉 Estas son las 4 cosas principales que puedo hacer por ti:

1️⃣ Registrar ingresos y gastos 📝
   Ejemplo: "Registra un gasto de $50 en comida"

2️⃣ Consultar tu saldo actual 💼
   Ejemplo: "¿Cuál es mi saldo?"

3️⃣ Generar reportes financieros 📊
   Ejemplo: "Genera un reporte de gastos del mes"

4️⃣ Ofrecer consejos sobre finanzas personales 💡
   Ejemplo: "Dame un consejo para ahorrar"

¿En qué te puedo ayudar hoy? ¡Estoy listo para empezar! 😊`;
      twiml.message(welcomeMessage);

      // Marcar al usuario como no nuevo
      user.isNewUser = false;
      await user.save();
    } else {
      let aiResponse;
      if (mediaType && mediaType.startsWith('audio/')) {
        aiResponse = await OpenAIService.processVoiceMessage(mediaUrl, waId);
      } else {
        aiResponse = await OpenAIService.processMessage(incomingMsg, waId, mediaUrl);
      }
      twiml.message(aiResponse);
    }

    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
    console.log('Respuesta enviada:', twiml.toString());
  } catch (error) {
    console.error('Error procesando la solicitud:', error);
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo más tarde.');
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
  }
});

export default router;