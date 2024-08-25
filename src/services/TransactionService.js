import Transaction from '../models/Transaction.js';
import UserService from './UserService.js';

class TransactionService {
  async registrarTransaccion(userId, { tipo, monto, categoria, subcategoria, descripcion }) {
    const user = await UserService.findUserById(userId);

    const transaction = await Transaction.create({
      userId,
      type: tipo,
      amount: parseFloat(monto),
      category: categoria,
      subcategory: subcategoria,
      description: descripcion
    });

    return {
      success: true,
      message: 'Transacción registrada correctamente',
      transaction
    };
  }

  async consultarSaldo(userId) {
    const user = await UserService.findUserById(userId);
    return {
      success: true,
      balance: user.balance
    };
  }
}

export default new TransactionService();