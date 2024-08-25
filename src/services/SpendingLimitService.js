import SpendingLimit from '../models/SpendingLimit.js';
import UserService from './UserService.js';

class SpendingLimitService {
  async crearLimiteGasto(userId, { amount, category, period, startDate, endDate }) {
    const user = await UserService.findUserById(userId);

    const spendingLimit = await SpendingLimit.create({
      userId,
      amount: parseFloat(amount),
      category,
      period,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    });

    return {
      success: true,
      message: 'Límite de gasto creado correctamente',
      spendingLimit
    };
  }

  async mostrarProgresoLimite(userId, period, category = null) {
    const user = await UserService.findUserById(userId);

    const whereClause = { userId, period };
    if (category) {
      whereClause.category = category;
    }

    const spendingLimit = await SpendingLimit.findOne({ where: whereClause });
    if (!spendingLimit) {
      throw new Error('Límite de gasto no encontrado');
    }

    const progress = (spendingLimit.spentAmount / spendingLimit.amount) * 100;
    return {
      success: true,
      message: `Has gastado ${spendingLimit.spentAmount} de tu límite de ${spendingLimit.amount} para ${spendingLimit.period}${category ? ` en la categoría ${category}` : ''}. ¡Vas por buen camino!`,
      progress
    };
  }
}

export default new SpendingLimitService();