import { PrismaClient } from '@prisma/client';

// Creamos una única instancia del cliente de Prisma para toda la aplicación
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma; 