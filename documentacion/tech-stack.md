# Stack Tecnológico: Wispen

## Backend
- **Node.js**: Entorno de ejecución para JavaScript del lado del servidor
- **Express.js**: Framework web minimalista y flexible para Node.js
- **TypeScript**: Superset tipado de JavaScript para mejor mantenibilidad y menos errores

## Base de Datos y Almacenamiento
- **Supabase**: Plataforma completa que proporciona:
  - PostgreSQL: Base de datos relacional para almacenar datos estructurados
  - Supabase Auth: Autenticación y autorización
  - Supabase Storage: Almacenamiento de archivos (reemplaza AWS S3)
- **Prisma**: ORM moderno para TypeScript/JavaScript, con excelente soporte para PostgreSQL
- **Redis** (opcional): Para caché y gestión de tareas en segundo plano

## Inteligencia Artificial
- **OpenAI**:
  - Assistants API: Para procesamiento de lenguaje natural y gestión de conversaciones
  - Whisper API: Para transcripción de notas de voz a texto
- **Mistral AI**: Para procesamiento OCR de imágenes (extracción de datos de recibos)

## Mensajería
- **WhatsApp Business API**: Conexión directa para recibir y enviar mensajes (sin Twilio como intermediario)

## Herramientas de Desarrollo
- **Zod**: Validación de esquemas con inferencia de tipos para TypeScript
- **Winston**: Librería de logging avanzada
- **Jest**: Framework de testing para JavaScript
- **ESLint**: Linter para identificar problemas en el código
- **Prettier**: Formateador de código para mantener consistencia

## Infraestructura y DevOps
- **Docker**: Contenedorización para desarrollo y despliegue consistentes
- **GitHub Actions**: CI/CD automatizado
- **Vercel/Railway**: Plataforma de despliegue para el backend
- **Sentry**: Monitoreo de errores en producción

## Utilidades y Librerías
- **Axios**: Cliente HTTP para realizar peticiones
- **date-fns**: Manipulación de fechas
- **xlsx**: Generación de archivos Excel para reportes
- **sharp**: Procesamiento de imágenes
- **node-schedule**: Programación de tareas
