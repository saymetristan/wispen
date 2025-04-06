# Integración con OpenAI Assistants API

## Descripción General

La integración con OpenAI utiliza la API de Assistants para proporcionar respuestas inteligentes a los mensajes de los usuarios. Esta API permite crear asistentes personalizados con instrucciones específicas y mantener el contexto de las conversaciones a través de "threads" (hilos de conversación).

## Componentes Principales

### 1. Cliente de OpenAI

El cliente de OpenAI (`OpenAIClient`) es una clase singleton que proporciona una instancia configurada del SDK oficial de OpenAI. Se encarga de:

- Inicializar la conexión con OpenAI utilizando la API key configurada
- Proporcionar métodos para verificar la conexión
- Servir como punto único de acceso al SDK de OpenAI

### 2. Servicio de Asistente

El servicio de asistente (`OpenAIAssistantService`) encapsula la lógica de:

- Creación y recuperación de asistentes
- Creación de threads de conversación
- Envío de mensajes a threads
- Ejecución del asistente para obtener respuestas
- Configuración de instrucciones para el asistente

### 3. Modelo de Dominio Thread

La entidad `Thread` representa un hilo de conversación y proporciona:

- Propiedades para identificar el thread (id, userId)
- Metadatos asociados al thread
- Fechas de creación y actualización
- Métodos para manipular thread

### 4. Repositorio de Threads

El repositorio de threads (`ThreadRepository` y su implementación `PrismaThreadRepository`) gestiona:

- Persistencia de threads en la base de datos
- Operaciones CRUD para threads
- Búsqueda de threads por usuario
- Creación automática de threads en OpenAI y la base de datos

## Flujo de Comunicación

1. **Recepción de mensaje**: Un mensaje de WhatsApp es recibido por el webhook
2. **Procesamiento inicial**: El servicio de WhatsApp identifica el remitente y el contenido
3. **Caso de uso**: Se ejecuta el caso de uso `ProcessWhatsAppMessage`
4. **Identificación de usuario**: Se busca o crea el usuario en base al número de teléfono
5. **Gestión de thread**: Se busca o crea un thread para el usuario
6. **Envío a OpenAI**: El mensaje se añade al thread y se ejecuta el asistente
7. **Respuesta**: La respuesta del asistente se devuelve al usuario vía WhatsApp

## Instrucciones del Asistente

El asistente ha sido configurado con instrucciones específicas:

- **Propósito**: Actuar como un asistente financiero personal en WhatsApp
- **Personalidad**: Amigable, conciso, práctico y motivador
- **Funciones**: Registrar transacciones, consultar saldos, generar resúmenes, responder preguntas financieras
- **Reglas**: Respuestas breves, no solicitar datos sensibles, pedir clarificaciones cuando sea necesario
- **Ejemplos**: Patrones de interacción como "Gasté X en Y", "Recibí X de Y", etc.

## Configuración

Para configurar la integración con OpenAI, se requieren las siguientes variables de entorno:

- `OPENAI_API_KEY`: Clave de API de OpenAI
- `OPENAI_ASSISTANT_ID`: ID del asistente existente (ya configurado como `asst_x1lJ9EZEPu3vlJVGoKRcgQV1`)

**Nota importante**: El asistente ya ha sido creado directamente en la plataforma de OpenAI con las instrucciones y capacidades necesarias. El sistema utilizará este asistente existente a través del ID configurado en las variables de entorno, evitando la creación de nuevos asistentes innecesarios.

Si se requiere modificar las instrucciones o capacidades del asistente, se recomienda hacerlo directamente desde el panel de control de OpenAI (https://platform.openai.com/assistants) y mantener el mismo ID en las variables de entorno.

## Pruebas

Para probar la integración con OpenAI, se pueden ejecutar los siguientes scripts:

### 1. Prueba general del servicio OpenAI

```
npx ts-node -r tsconfig-paths/register src/test-openai.ts
```

Este script:
- Verifica la conexión con OpenAI
- Obtiene o crea un asistente
- Crea un thread de prueba
- Envía un mensaje y obtiene una respuesta

### 2. Prueba específica del asistente configurado

```
npx ts-node -r tsconfig-paths/register src/test-assistant.ts
```

Este script más especializado:
- Verifica que el ID del asistente esté configurado correctamente
- Confirma que el asistente existe en la plataforma de OpenAI
- Crea un thread de prueba y envía una pregunta específica
- Muestra la respuesta completa del asistente

Se recomienda ejecutar el segundo script para verificar que la integración con el asistente configurado funciona correctamente.

## Limitaciones y Consideraciones

- **Tiempo de respuesta**: Las respuestas del asistente pueden tardar varios segundos
- **Persistencia de contexto**: Los threads preservan el contexto, pero tienen una vida útil limitada
- **Costos**: El uso de la API de OpenAI conlleva costos basados en tokens
- **Latencia**: Las interacciones con la API pueden verse afectadas por problemas de red 