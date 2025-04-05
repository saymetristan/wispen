# 1. Documento Central: Proyecto Wispen

## Visión General

Wispen es un asistente financiero personal que opera a través de WhatsApp. Su objetivo principal es facilitar a los usuarios la gestión de sus finanzas personales mediante interacciones conversacionales en lenguaje natural. El sistema permite registrar transacciones (gastos e ingresos), consultar saldos, generar reportes, establecer metas de ahorro, definir límites de gasto y recibir consejos financieros personalizados.

## Características Principales

### Core (MVP)
- **Registro de Transacciones**: Ingreso de gastos e ingresos mediante texto en lenguaje natural
- **Consulta de Saldo**: Ver balance actual y resúmenes básicos
- **Categorización Automática**: Clasificación inteligente de transacciones
- **Perfiles de Usuario**: Información básica y preferencias

### Fase 2
- **Entrada Multimodal**: Procesamiento de notas de voz y fotos de recibos
- **Límites de Gasto**: Establecer y monitorear límites por categorías
- **Reportes Mejorados**: Análisis de gastos por categoría y período
- **Onboarding Optimizado**: Experiencia de bienvenida mejorada

### Fase 3
- **Metas de Ahorro**: Crear y seguir objetivos financieros
- **Reportes Exportables**: Generación de archivos Excel para análisis detallado
- **Consejos Personalizados**: Recomendaciones basadas en patrones de gasto
- **Comandos Avanzados**: Funciones especiales (/reset, /seguridad, etc.)

### Fase 4
- **Interacción con Botones**: Interfaz enriquecida con quick replies
- **Notificaciones Programadas**: Alertas y recordatorios automáticos
- **Optimización de Experiencia**: Mejoras en toda la interacción
- **Seguridad Avanzada**: Protección de datos y privacidad

## Arquitectura Técnica

### Arquitectura Clean
Implementamos una arquitectura limpia con separación clara de responsabilidades:

1. **Core (Domain)**: 
   - Entidades y modelos de negocio
   - Casos de uso e interactores

2. **Adaptadores**:
   - Controllers (API/WhatsApp)
   - Repositories (Supabase)
   - Servicios externos (OpenAI, Mistral)

3. **Infraestructura**:
   - Conexiones a servicios externos
   - Configuraciones

### Componentes Clave

- **Backend**: Node.js con Express.js para la API y lógica de negocio
- **Base de Datos**: Supabase (PostgreSQL) con modelos para Usuario, Transacción, MetaAhorro, LímiteGasto
- **Almacenamiento**: Supabase Storage para archivos generados
- **Inteligencia Artificial**:
  - OpenAI Assistants API para procesamiento de lenguaje y gestión de conversaciones
  - OpenAI Whisper para transcripción de audio
  - Mistral AI para OCR y procesamiento de imágenes de recibos
- **Mensajería**: WhatsApp Business API (conexión directa) para comunicación con usuarios
- **Herramientas**: Prisma como ORM, Zod para validación, Winston para logging

## Flujo de Trabajo Típico

1. **Recepción del Mensaje**: El usuario envía un mensaje a Wispen por WhatsApp (texto, audio o imagen)
2. **Procesamiento Inicial**: 
   - Se identifica el tipo de mensaje y el usuario
   - Se realiza el onboarding si es nuevo usuario
3. **Procesamiento de IA**:
   - Para texto: Se interpreta con OpenAI Assistants
   - Para audio: Se transcribe con Whisper y luego se procesa como texto
   - Para imágenes: Se extrae información con Mistral OCR
4. **Ejecución de Acciones**:
   - Si requiere acceso a datos, se ejecutan funciones específicas
   - Se registran transacciones, consultas o se generan reportes según corresponda
5. **Respuesta al Usuario**:
   - Se genera respuesta textual o enriquecida (con archivos o botones)
   - Se envía la respuesta a través de WhatsApp

## Consideraciones Especiales

### Seguridad y Privacidad
- Autenticación segura para todas las APIs
- Aislamiento de datos por usuario
- Implementación de comando /seguridad para transparencia
- Opción de eliminar datos mediante comando /reset

### Escalabilidad
- Arquitectura modular preparada para crecimiento
- Optimización de costos de APIs externas
- Manejo eficiente de recursos

### Experiencia de Usuario
- Lenguaje conversacional y amigable
- Capacidad de entender instrucciones en lenguaje natural
- Respuestas personalizadas y contextuales
- Múltiples canales de entrada (texto, voz, imágenes)

## Métricas de Éxito
- **Retención de Usuarios**: Porcentaje que sigue usando Wispen después de 30 días
- **Precisión de Categorización**: Exactitud en la clasificación automática de transacciones
- **Tiempo de Respuesta**: Latencia entre mensaje de usuario y respuesta del sistema
- **Satisfacción**: Feedback positivo y uso continuo


