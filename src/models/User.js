import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  threadId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  onboardingThreadId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  threadCreatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isNewUser: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  ocupacion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ingresoMensualPromedio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  limiteGastoMensual: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  monedaPreferencia: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ahorrosActuales: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  isOnboarding: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  assistant_ID: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'asst_AUZqqVPMNJFedXX3A5fYBp7f' // ID del asistente de onboarding
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

export default User;