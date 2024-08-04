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

    if (!user) {
      logger.info(`Usuario no encontrado para el ID: ${userId}`);
      return next();
    }

    logger.info(`Estado actual del usuario ${userId}:`, {
      name: user.name,
      isNewUser: user.isNewUser,
      isOnboarding: user.isOnboarding,
      assistant_ID: user.assistant_ID
    });

    const perfilCompleto = user.name && user.ocupacion && user.ingresoMensualPromedio && user.limiteGastoMensual && user.monedaPreferencia && (user.ahorrosActuales !== null && user.ahorrosActuales !== undefined);

    if (perfilCompleto && (user.isNewUser || user.isOnboarding)) {
      user.assistant_ID = 'asst_4aycqyziNvkiMm88Sf1CvPJg';
      user.threadId = null;
      user.isOnboarding = false;
      user.isNewUser = false;
      await user.save();

      logger.info(`Usuario ${userId} actualizado: perfil completo, nuevo Assistant ID asignado.`, {
        assistant_ID: user.assistant_ID,
        isNewUser: user.isNewUser,
        isOnboarding: user.isOnboarding
      });
    }

    next();
  } catch (error) {
    logger.error('Error en userStatusMiddleware:', error);
    next(error);
  }
};

export default userStatusMiddleware;