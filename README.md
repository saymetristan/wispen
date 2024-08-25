# Wispen: Sabiduria para tus finanzas

## Descripción General

Wispen es un asistente financiero inteligente que opera a través de WhatsApp, diseñado para ayudar a los usuarios a gestionar sus finanzas personales de manera eficiente y accesible. Utilizando la potencia de la inteligencia artificial y la comodidad de la mensajería instantánea, Wispen ofrece una experiencia personalizada para el seguimiento de gastos, ingresos y la generación de informes financieros.

## Características Principales

1. **Registro de Transacciones**: Los usuarios pueden registrar fácilmente sus gastos e ingresos enviando mensajes de texto, notas de voz o imágenes de recibos.
2. **Procesamiento de Lenguaje Natural**: Wispen utiliza avanzados modelos de IA para interpretar y procesar las solicitudes de los usuarios en lenguaje natural.
3. **Análisis de Imágenes**: Capacidad para extraer información financiera relevante de imágenes de recibos o facturas.
4. **Informes Financieros**: Generación de reportes detallados sobre el estado financiero del usuario, incluyendo balances, gastos por categoría y tendencias de ahorro.
5. **Consejos Personalizados**: Ofrece recomendaciones financieras basadas en los patrones de gasto y los objetivos del usuario.
6. **Múltiples Formatos de Entrada**: Acepta interacciones a través de texto, audio y imágenes para mayor flexibilidad.
7. **Perfil de Usuario Personalizado**: Mantiene un perfil detallado de cada usuario, incluyendo información como ocupación, ingresos mensuales y objetivos de ahorro.

## Arquitectura Técnica

Wispen está construido con una arquitectura moderna y escalable:

- **Backend**: Node.js con Express.js
- **Base de Datos**: PostgreSQL gestionada a través de Sequelize ORM
- **Integración de IA**: OpenAI API para procesamiento de lenguaje natural y análisis de imágenes
- **Mensajería**: Integración con la API de WhatsApp Business a través de Twilio

## Componentes Clave

### 1. Servicio OpenAI (OpenAIService)

Este servicio es el núcleo de la inteligencia de Wispen. Maneja la interacción con la API de OpenAI para procesar mensajes, generar respuestas y realizar análisis de datos.

Funciones principales:
- `processMessage`: Procesa mensajes de texto e imágenes.
- `processVoiceMessage`: Transcribe y procesa mensajes de voz.
- `uploadImage`: Sube imágenes a OpenAI para su análisis.
- `handleFunctionCalls`: Gestiona llamadas a funciones específicas como registro de transacciones o generación de informes.

### 2. Rutas de WhatsApp (whatsappRoutes)

Maneja las interacciones entrantes de WhatsApp, dirigiendo los mensajes al servicio apropiado para su procesamiento.

Características:
- Validación de números de teléfono
- Detección del tipo de mensaje (texto, audio, imagen)
- Manejo de errores y respuestas

### 3. Modelos de Datos

#### Usuario (User)
Almacena información detallada del usuario, incluyendo:
- Datos personales (nombre, número de teléfono)
- Información financiera (balance, ingresos mensuales, límites de gasto)
- Datos de sesión (ID de thread, estado de onboarding)

#### Transacción (Transaction)
Registra todas las transacciones financieras del usuario:
- Tipo (ingreso o gasto)
- Monto
- Categoría
- Descripción

#### Meta de Ahorro (SavingGoal)
Registra las metas de ahorro del usuario:
- Monto
- Descripción
- Duración
- Cantidad ahorrada
- Fecha objetivo

#### Límite de Gasto (SpendingLimit)
Registra los límites de gasto del usuario:
- Monto
- Categoría
- Periodo
- Fecha de inicio y fin
- Cantidad gastada

### 4. Servicios Adicionales

- `WhatsAppService`: Maneja el envío de mensajes a través de la API de Twilio.
- `userStatusMiddleware`: Middleware para rastrear y registrar el estado del usuario en cada interacción.
- `InstructionService`: Proporciona instrucciones sobre cómo usar Wispen.
- `ExcuseService`: Genera excusas creativas para justificar gastos.
- `SecurityService`: Proporciona información sobre seguridad y privacidad.
- `RunService`: Maneja la espera y finalización de ejecuciones de OpenAI.
- `AssistantService`: Gestiona la creación y finalización de ejecuciones de OpenAI.
- `SavingGoalService`: Gestiona la creación y seguimiento de metas de ahorro.
- `SpendingLimitService`: Gestiona la creación y seguimiento de límites de gasto.
- `MessageProcessingService`: Procesa el contenido de los mensajes.
- `ReportService`: Genera reportes financieros.
- `CSVService`: Convierte datos a formato CSV.
- `S3Service`: Maneja la subida y eliminación de archivos en S3.
- `TransactionService`: Gestiona el registro y consulta de transacciones.
- `NotificationService`: Envía alertas a los usuarios.
- `UserService`: Gestiona la información del usuario.
- `VoiceService`: Procesa notas de voz.

## Flujo de Trabajo

1. El usuario envía un mensaje a Wispen a través de WhatsApp.
2. El mensaje es recibido por el webhook de Twilio y procesado por `whatsappRoutes`.
3. Dependiendo del tipo de mensaje, se invoca el método apropiado de `OpenAIService`.
4. `OpenAIService` procesa el mensaje, interactúa con la API de OpenAI, y realiza las operaciones necesarias (por ejemplo, registrar una transacción).
5. Se genera una respuesta que se envía de vuelta al usuario a través de WhatsApp.

## Características Avanzadas

- **Manejo de Sesiones**: Wispen mantiene un hilo de conversación (thread) para cada usuario, permitiendo contexto y continuidad en las interacciones.
- **Onboarding Personalizado**: Proceso de bienvenida para nuevos usuarios, recopilando información inicial para personalizar la experiencia.
- **Análisis de Voz**: Capacidad para procesar notas de voz, transcribirlas y extraer información financiera relevante.
- **Procesamiento de Imágenes**: Análisis de recibos y facturas para extraer automáticamente detalles de transacciones.

## Seguridad y Privacidad

- Autenticación segura para todas las interacciones con APIs externas.
- Encriptación de datos sensibles en la base de datos.
- Cumplimiento con regulaciones de protección de datos.

## Conclusión

Wispen representa una solución innovadora en el campo de la gestión financiera personal, combinando la accesibilidad de WhatsApp con la potencia de la inteligencia artificial. Su diseño modular y escalable permite una fácil expansión y mejora continua, ofreciendo a los usuarios una herramienta poderosa y fácil de usar para mejorar su salud financiera.