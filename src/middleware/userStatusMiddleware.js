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
      if (user.isOnboarding) {
        logger.info(`El usuario ${userId} está en proceso de onboarding. Ignorando el mensaje.`);
        return res.status(200).send('El usuario está en proceso de onboarding.');
      }

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