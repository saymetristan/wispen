import { DataTypes } from 'sequelize';
import sequelize from '../config/database';

const SavingGoal = sequelize.define('SavingGoal', {
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
