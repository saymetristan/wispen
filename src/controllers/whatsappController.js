import openaiService from '../services/openaiService.js';

class WhatsAppController {
  async handleMessage(req, res) {
    try {
      const message = req.body.message;
      const response = await openaiService.processMessage(message);
      res.json({ response });
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default new WhatsAppController();