import * as express from 'express';

// Crear la aplicación Express
const app = express();
const port = 3000;

// Ruta básica de salud
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'Servidor de prueba funcionando correctamente' });
});

// Iniciar el servidor
// eslint-disable-next-line no-console
app.listen(port, () => {
  console.log(`Servidor de prueba iniciado en puerto ${port}`);
}); 