class InstructionService {
    provideInstructions() {
      const instructions = `¡*hola*! bienvenido a wispen, tu nuevo amigo financiero. aquí te explicamos cómo usarlo de forma fácil y rápida.
  
  _registra tus gastos e ingresos_
  puedes hacerlo de tres formas:
  • *texto*: escribe "gasto 20 en comida" o "ingreso 500 de sueldo".
  • *voz*: envía una nota de voz diciendo lo que gastaste o ingresaste.
  • *foto*: toma una foto del recibo y wispen leerá la información.
  
  _consulta tu estado financiero_
  • pregunta cosas como:
     • "¿cuánto he gastado este mes?"
     • "muéstrame mis ingresos de la semana pasada"
     • "¿cuál es mi balance actual?"
  
  _pide consejos_
  wispen puede darte tips financieros. prueba con:
  • "dame un consejo para ahorrar"
  • "¿cómo puedo reducir mis gastos?"
  • "ayúdame a hacer un presupuesto"
  
  ¡*listo*! ahora ya sabes cómo usar wispen. recuerda, estamos aquí para hacer tus finanzas más fáciles y divertidas.
  ¡comienza a chatear y mejora tu salud financiera hoy mismo!
  
  _wispen tiene algunos comandos útiles que puedes usar en cualquier momento:_
  • */feedback*: para enviar tus comentarios o sugerencias sobre wispen.
  • */notificaciones*: para configurar o ajustar tus preferencias de notificaciones.
  • */excusometro3000*: para activar el excusómetro 3000 directamente.
  • */suscripcion*: para ver o modificar los detalles de tu suscripción.
  • */seguridad*: para saber más sobre seguridad y privacidad.`;
    
      return instructions;
    }
  }
  
  export default new InstructionService();