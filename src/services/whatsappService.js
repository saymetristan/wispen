import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

class WhatsAppService {
  async sendMessage(to, body) {
    try {
      const message = await client.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        body: body,
        to: `whatsapp:${to}`
      });

      logger.info(`Message sent successfully. SID: ${message.sid}`);
      return message;
    } catch (error) {
      logger.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }
}

export default new WhatsAppService();