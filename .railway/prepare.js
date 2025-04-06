#!/usr/bin/env node

console.log('🚀 Ejecutando script de preparación para Railway...');

const { execSync } = require('child_process');
const path = require('path');

// Función para ejecutar comandos y mostrar la salida
function runCommand(command) {
  console.log(`Ejecutando: ${command}`);
  try {
    const output = execSync(command, { stdio: 'inherit' });
    return output;
  } catch (error) {
    console.error(`Error ejecutando comando: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

// Función principal
async function main() {
  try {
    console.log('📊 Generando cliente Prisma...');
    runCommand('npx prisma generate');

    console.log('🔄 Aplicando migraciones a la base de datos...');
    runCommand('npx prisma migrate deploy');

    console.log('✅ Preparación completada con éxito!');
  } catch (error) {
    console.error('❌ Error durante la preparación:', error);
    process.exit(1);
  }
}

// Ejecutar la función principal
main().catch(err => {
  console.error('Error fatal en el script de preparación:', err);
  process.exit(1);
}); 