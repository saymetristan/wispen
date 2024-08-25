import SavingGoal from '../models/savingGoal.js';
import UserService from './UserService.js';

class SavingGoalService {
  async crearMetaAhorro(userId, { amount, description, duration }) {
    const user = await UserService.findUserById(userId);

    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + parseInt(duration));

    const savingGoal = await SavingGoal.create({
      userId,
      amount: parseFloat(amount),
      description,
      duration,
      targetDate
    });

    return {
      success: true,
      message: 'Meta de ahorro creada correctamente',
      savingGoal
    };
  }

  async mostrarProgresoMeta(userId) {
    const user = await UserService.findUserById(userId);

    const savingGoal = await SavingGoal.findOne({ where: { userId, description } });
    if (!savingGoal) {
      throw new Error('Meta de ahorro no encontrada');
    }

    const progress = (savingGoal.savedAmount / savingGoal.amount) * 100;
    return {
      success: true,
      message: `Has ahorrado ${savingGoal.savedAmount} de tu meta de ${savingGoal.amount} para ${savingGoal.description}. ¡Vas por buen camino!`,
      progress
    };
  }
}

export default new SavingGoalService();