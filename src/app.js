import express from 'express';
import bodyParser from 'body-parser';
import userRoutes from './routes/userRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import whatsappRoutes from './routes/whatsappRoutes.js';
import errorHandler from './utils/errorHandler.js';
import sequelize from './config/database.js';
import User from './models/User.js';
import Transaction from './models/Transaction.js';
import dotenv from 'dotenv';
import logger from './utils/logger.js';

dotenv.config();

const app = express();

app.use(bodyParser.json());

app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/whatsapp', whatsappRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

sequelize.sync().then(() => {
  logger.info('Base de datos sincronizada');
}).catch((error) => {
  logger.error('Error al sincronizar la base de datos:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.listen(PORT, () => {
  logger.info(`Servidor corriendo en el puerto ${PORT}`);
});

export default app;