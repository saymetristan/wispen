import openai from '../config/openai.js';
import User from '../models/User.js';
import { THREAD_EXPIRY_DAYS } from '../config/constants.js';

class ThreadService {
  async getOrCreateThread(userId) {
    if (!userId) {
      throw new Error('ID de usuario no proporcionado');
    }

    let user = await User.findByPk(userId);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (!user.threadId || this.isThreadExpired(user.threadCreatedAt)) {
      const thread = await openai.beta.threads.create();
      user.threadId = thread.id;
      user.threadCreatedAt = new Date();
      await user.save();
    }

    return user.threadId;
  }

  isThreadExpired(threadCreatedAt) {
    if (!threadCreatedAt) return true;
    const expiryDate = new Date(threadCreatedAt.getTime() + THREAD_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    return new Date() > expiryDate;
  }
}

export default new ThreadService();


