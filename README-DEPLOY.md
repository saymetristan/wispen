# Guía de Despliegue en Railway para Wispen 2.0

Este documento proporciona instrucciones detalladas para desplegar la aplicación Wispen 2.0 en Railway.

## Requisitos Previos

- Cuenta en [Railway](https://railway.app)
- Cuenta en GitHub vinculada a Railway
- Repositorio de Wispen 2.0 en GitHub

## Pasos para el Despliegue

### 1. Configuración en Railway

1. Inicia sesión en [Railway Dashboard](https://railway.app/dashboard)
2. Haz clic en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Busca y selecciona el repositorio de Wispen 2.0
5. Railway detectará automáticamente la configuración del proyecto en `railway.toml`

### 2. Configuración de Variables de Entorno

Es necesario configurar las siguientes variables de entorno en Railway:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=...
DIRECT_URL=...
SUPABASE_DATABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...
SUPABASE_JWT_SECRET=...
SUPABASE_DATABASE_PASSWORD=...
OPENAI_API_KEY=...
OPENAI_ASSISTANT_ID=...
MISTRAL_API_KEY=...
WHATSAPP_API_URL=https://graph.facebook.com
WHATSAPP_API_VERSION=v18.0
WHATSAPP_APP_SECRET=...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_BUSINESS_ACCOUNT_ID=...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=...
LOG_LEVEL=info
```

Para agregar estas variables:
1. En el proyecto en Railway, ve a la pestaña "Variables"
2. Agrega cada variable con su valor correspondiente
3. Railway reiniciará automáticamente el despliegue después de guardar

### 3. Configuración de la Base de Datos

#### Usando PostgreSQL de Railway

1. En Railway Dashboard, haz clic en "New"
2. Selecciona "Database" > "PostgreSQL"
3. Una vez creada, ve a la pestaña "Connect" para obtener la URL de conexión
4. Configura las variables de entorno `DATABASE_URL` y `DIRECT_URL` con esta URL

#### Usando Supabase (recomendado)

1. Asegúrate de que las variables de Supabase estén correctamente configuradas
2. El script `.railway/prepare.js` se encargará de las migraciones automáticamente

### 4. Dominios y URLs Públicas

1. En el proyecto en Railway, ve a la pestaña "Settings" > "Domains"
2. Genera un dominio público de Railway o configura tu dominio personalizado
3. Una vez obtenido el dominio, actualiza la configuración del webhook de WhatsApp para utilizar esta URL

### 5. Webhook WhatsApp

Configura el webhook de WhatsApp con tu nueva URL de Railway:
- URL del webhook: `https://tu-app.railway.app/api/v1/webhook`
- Token de verificación: El mismo que está en las variables de entorno

### 6. Monitoreo y Logs

1. En Railway, ve a la pestaña "Deployments" para ver los despliegues
2. Haz clic en un despliegue específico para ver los logs
3. Utiliza estos logs para verificar que todo funciona correctamente

## Solución de Problemas

### Error en Migraciones de Base de Datos

1. Verifica las credenciales de la base de datos
2. Ejecuta migraciones manualmente: `railway run npx prisma migrate deploy`
3. Verifica los logs: `railway logs`

### Problemas con el Webhook de WhatsApp

1. Verifica que la URL del webhook sea accesible públicamente
2. Asegúrate de que el token de verificación coincida con el configurado en las variables de entorno
3. Revisa los logs para ver posibles errores en las solicitudes entrantes

### Problemas con OpenAI

1. Verifica que la API key de OpenAI sea válida
2. Asegúrate de que el ID del asistente sea correcto
3. Revisa los logs para ver posibles errores en las llamadas a la API

## Recomendaciones para Producción

1. Habilita la autoscaling en Railway para manejar picos de tráfico
2. Configura alertas de monitoreo para ser notificado ante problemas
3. Realiza revisiones periódicas de los logs para identificar posibles mejoras
4. Implementa un sistema de backup para la base de datos

## Recursos Adicionales

- [Documentación oficial de Railway](https://docs.railway.app/)
- [Documentación de Prisma Deploy](https://www.prisma.io/docs/orm/prisma-migrate/workflows/deployment)
- [Documentación de WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/cloud-api) 