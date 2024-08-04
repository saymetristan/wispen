import User from '../models/User.js';
import logger from '../utils/logger.js';

const userStatusMiddleware = async (req, res, next) => {
  const userId = req.body.WaId;

  if (!userId) {
    return next();
  }

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return next();
    }

    const perfilCompleto = user.name && user.ocupacion && user.ingresoMensualPromedio && user.limiteGastoMensual && user.monedaPreferencia;

    if (perfilCompleto && user.assistant_ID === 'asst_AUZqqVPMNJFedXX3A5fYBp7f') {
      user.assistant_ID = 'asst_4aycqyziNvkiMm88Sf1CvPJg';
      user.threadId = null;
      user.isOnboarding = false;
      user.isNewUser = false;
      await user.save();

      logger.info(`Usuario ${userId} actualizado: perfil completo, nuevo Assistant ID asignado.`);
    }

    next();
  } catch (error) {
    logger.error('Error en userStatusMiddleware:', error);
    next(error);
  }
};

export default userStatusMiddleware;
