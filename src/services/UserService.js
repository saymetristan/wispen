import User from '../models/User.js';

class UserService {
  async findUserById(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    return user;
  }

  async updateUser(user) {
    await user.save();
  }
}

export default new UserService();