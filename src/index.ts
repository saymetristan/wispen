import express from 'express';
import dotenv from 'dotenv';
import { setupLogger } from '@utils/logger';

// Cargar variables de entorno
dotenv.config();

// Configuración del logger
const logger = setupLogger();

// Crear la aplicación Express
const app = express();
const port = process.env.PORT || 3000;

// Middlewares básicos
app.use(express.json());

// Ruta básica de salud
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Wispen está funcionando correctamente' });
});

// Iniciar el servidor
app.listen(port, () => {
  logger.info(`Servidor iniciado en puerto ${port}`);
}); 