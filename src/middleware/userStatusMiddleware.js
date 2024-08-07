import User from '../models/User.js';
import logger from '../utils/logger.js';

const userStatusMiddleware = async (req, res, next) => {
  const userId = req.body.WaId;

  if (!userId) {
    logger.info('No se proporcionó userId en la solicitud');
    return next();
  }

  try {
    const user = await User.findByPk(userId);

    if (user) {
      logger.info(`Estado actual del usuario ${userId}:`, {
        name: user.name,
        assistant_ID: user.assistant_ID,
        threadId: user.threadId
      });
    }

    next();
  } catch (error) {
    logger.error('Error en userStatusMiddleware:', error);
    next(error);
  }
};

export default userStatusMiddleware;