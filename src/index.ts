import * as express from 'express';
import * as dotenv from 'dotenv';
import { logger } from '@utils/logger';
import { configureServer } from '@infrastructure/webserver/server';

// Cargar variables de entorno
dotenv.config();

// Crear la aplicación Express
const app = express();
const port = process.env.PORT || 3000;

// Configurar el servidor
configureServer(app);

// Iniciar el servidor
app.listen(port, () => {
  logger.info(`Servidor iniciado en puerto ${port}`);
});
