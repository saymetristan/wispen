# Wispen 2.0

Asistente financiero inteligente via WhatsApp que ayuda a los usuarios a administrar sus finanzas personales mediante una interacción conversacional natural.

## Características Principales

- Registro y seguimiento de transacciones financieras
- Categorización automática de gastos e ingresos
- Reportes financieros personalizados
- Procesamiento de instrucciones en lenguaje natural (texto, audio, imágenes)
- Alertas y notificaciones personalizadas
- Establecimiento y seguimiento de metas financieras

## Stack Tecnológico

- **Backend**: Node.js, Express, TypeScript
- **Base de Datos**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **IA**: OpenAI (Assistants API, Whisper), Mistral AI
- **Mensajería**: WhatsApp Business API
- **Infraestructura**: Docker, GitHub Actions

## Arquitectura

El proyecto sigue los principios de Clean Architecture con la siguiente estructura:

```
src/
  ├── core/           # Dominio y lógica de negocio
  │   ├── domain/     # Entidades y reglas de negocio
  │   └── usecases/   # Casos de uso de la aplicación
  ├── adapters/       # Adaptadores y puertos
  │   ├── controllers/# Controladores HTTP y WebHooks
  │   └── repositories/# Implementación de repositorios 
  ├── infrastructure/ # Infraestructura y servicios externos
  │   ├── database/   # Configuración de base de datos
  │   ├── services/   # Servicios externos (OpenAI, WhatsApp)
  │   ├── webserver/  # Configuración del servidor web
  │   └── config/     # Configuraciones generales
  └── utils/          # Utilidades comunes
```

## Instalación

1. Clonar el repositorio:
   ```
   git clone https://github.com/tu-usuario/wispen.git
   cd wispen
   ```

2. Instalar dependencias:
   ```
   npm install
   ```

3. Configurar variables de entorno:
   ```
   cp .env.example .env
   # Editar .env con tus propias credenciales
   ```

4. Iniciar el servidor de desarrollo:
   ```
   npm run dev
   ```

## Comandos Disponibles

- `npm start`: Inicia la aplicación en producción
- `npm run dev`: Inicia la aplicación en modo desarrollo
- `npm run build`: Compila el proyecto
- `npm test`: Ejecuta las pruebas
- `npm run lint`: Verifica el código con ESLint

## Contribución

Para contribuir al proyecto, por favor revisa las guías de contribución en `CONTRIBUTING.md`. 