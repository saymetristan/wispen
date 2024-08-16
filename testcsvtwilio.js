import twilio from 'twilio';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const sendCSVToWhatsApp = async (phoneNumber, filePath) => {
  try {
    // Enviar un mensaje de texto informando sobre el reporte
    await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      body: 'Aquí tienes tu reporte generado:',
      to: `whatsapp:${phoneNumber}`
    });

    // Enviar el archivo CSV
    await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      mediaUrl: ['https://files-wispen.s3.us-east-2.amazonaws.com/test/archivo_convertido.xlsx'],
      to: `whatsapp:${phoneNumber}`
    });

    console.log(`Reporte CSV enviado a ${phoneNumber}`);
  } catch (error) {
    console.error('Error al enviar el archivo CSV:', error);
  }
};

// Ruta del archivo CSV
const filePath = './test.csv';

// Tu número de teléfono
const phoneNumber = '+528139692995';

// Ejecutar la función
sendCSVToWhatsApp(phoneNumber, filePath);
