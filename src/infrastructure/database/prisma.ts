import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

// Configuración del cliente Prisma con logging
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error', 'warn', 'query'],
    errorFormat: 'pretty',
  });
};

// Manejo de singleton para conexión
declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

// Prueba de conexión a la base de datos
export const testPrismaConnection = async (): Promise<boolean> => {
  try {
    // Realizar una consulta simple para probar la conexión
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Conexión a la base de datos con Prisma establecida correctamente');
    return true;
  } catch (error) {
    logger.error('Error al conectar con la base de datos', {
      error: (error as Error).message,
    });
    return false;
  }
};

export default prisma; 