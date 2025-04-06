import 'dotenv/config';
import { ProcessWhatsAppMessage } from '@core/usecases/ProcessWhatsAppMessage';
import { logger } from '@utils/logger';

/**
 * Función principal para probar el asistente financiero
 */
async function testFinancialAssistant() {
  logger.info('Iniciando prueba del asistente financiero');
  
  const phoneNumber = '5215512345678';
  const processMessageUseCase = new ProcessWhatsAppMessage();
  
  // Test 1: Consultar saldo
  await testMessage(
    processMessageUseCase, 
    phoneNumber, 
    '¿Cuál es mi saldo actual?'
  );
  
  // Test 2: Registrar un gasto
  await testMessage(
    processMessageUseCase, 
    phoneNumber, 
    'Registra un gasto de 350 pesos en comida que hice ayer'
  );
  
  // Test 3: Registrar un ingreso
  await testMessage(
    processMessageUseCase, 
    phoneNumber, 
    'Recibí 5000 pesos de mi sueldo el lunes'
  );
  
  // Test 4: Consultar saldo después de transacciones
  await testMessage(
    processMessageUseCase, 
    phoneNumber, 
    '¿Cuánto dinero me queda disponible?'
  );
  
  // Test 5: Generar un reporte
  await testMessage(
    processMessageUseCase, 
    phoneNumber, 
    'Dame un reporte de gastos de este mes'
  );
  
  logger.info('Prueba del asistente financiero completada');
}

/**
 * Función para probar un mensaje específico
 */
async function testMessage(
  useCase: ProcessWhatsAppMessage, 
  phone: string, 
  message: string
) {
  logger.info('Enviando mensaje de prueba', {
    phone,
    message
  });
  
  console.log('\n--------------------');
  console.log(`📱 Mensaje usuario: ${message}`);
  
  const startTime = Date.now();
  const response = await useCase.execute(phone, message);
  const endTime = Date.now();
  
  console.log(`🤖 Respuesta (${endTime - startTime}ms):`);
  console.log(response);
  console.log('--------------------\n');
  
  return response;
}

// Ejecutar la prueba
testFinancialAssistant()
  .then(() => {
    logger.info('Prueba completada correctamente');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Error en la prueba', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }); 