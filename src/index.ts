import express from 'express';
import dotenv from 'dotenv';
import { logger } from './infrastructure/config/logger';

// Cargar variables de entorno
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middlewares básicos
app.use(express.json());

// Ruta básica de salud
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Wispen está funcionando correctamente' });
});

// Iniciar servidor
app.listen(port, () => {
  logger.info(`Servidor iniciado en puerto ${port}`);
});

export default app;
