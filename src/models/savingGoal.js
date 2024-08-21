import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SavingGoal = sequelize.define('SavingGoal', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  duration: {
    type: DataTypes.STRING,
    allowNull: false
  },
  savedAmount: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  targetDate: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  timestamps: true
});

export default SavingGoal;