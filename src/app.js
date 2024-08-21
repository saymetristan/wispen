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
import NotificationService from './services/notificationService.js'; // Importar el servicio de notificaciones

dotenv.config();

const app = express();

app.use(bodyParser.json());

app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/whatsapp', whatsappRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

sequelize.sync().then(async () => {
  console.log('Base de datos conectada y sincronizada');
  await NotificationService.init();
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
}).catch((error) => {
  console.error('Error al sincronizar la base de datos:', error);
});

export default app;