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

    const perfilCompleto = user.name && user.ocupacion && user.ingresoMensualPromedio && user.limiteGastoMensual && user.monedaPreferencia;

    logger.info(`Perfil completo para el usuario ${userId}: ${perfilCompleto}`);

    if (perfilCompleto && user.assistant_ID === 'asst_AUZqqVPMNJFedXX3A5fYBp7f') {
      user.assistant_ID = 'asst_4aycqyziNvkiMm88Sf1CvPJg';
      // Solo establecemos threadId a null si aún no existe
      if (!user.threadId) {
        user.threadId = null;
      }
      user.isOnboarding = false;
      user.isNewUser = false;
      await user.save();

      logger.info(`Usuario ${userId} actualizado: perfil completo, nuevo Assistant ID asignado.`, {
        assistant_ID: user.assistant_ID,
        threadId: user.threadId,
        isOnboarding: user.isOnboarding,
        isNewUser: user.isNewUser
      });
    } else {
      logger.info(`No se actualizó el usuario ${userId}. Perfil completo: ${perfilCompleto}, Assistant ID actual: ${user.assistant_ID}, ThreadId: ${user.threadId}`);
    }

    next();
  } catch (error) {
    logger.error('Error en userStatusMiddleware:', error);
    next(error);
  }
};

export default userStatusMiddleware;