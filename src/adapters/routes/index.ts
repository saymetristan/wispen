import { Router } from 'express';
import whatsappRoutes from './whatsapp.routes';

// Router principal de la API
const router = Router();

// Registrar rutas por dominio
router.use('/whatsapp', whatsappRoutes);

// Aquí se añadirán más rutas conforme crezca la aplicación

export default router; 