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

## Funcionalidades del Asistente Financiero

El asistente financiero implementado con OpenAI Assistant API tiene las siguientes funcionalidades:

### 1. Registro de Transacciones

El asistente puede registrar transacciones (ingresos y gastos) en la base de datos a partir de mensajes de texto del usuario.

Ejemplos:
- "Registra un gasto de 350 pesos en comida que hice ayer"
- "Acabo de recibir 5000 pesos de mi sueldo"
- "Gasté 200 pesos en transporte esta mañana"

La funcionalidad incluye:
- Interpretación de la intención del usuario
- Extracción del monto, categoría y fecha de la transacción
- Categorización automática basada en palabras clave
- Almacenamiento en la base de datos
- Confirmación al usuario con el saldo actualizado

### 2. Consulta de Saldo

El asistente permite consultar el saldo actual o de un período específico.

Ejemplos:
- "¿Cuál es mi saldo actual?"
- "¿Cuánto dinero me queda disponible?"
- "¿Cuál fue mi saldo en mayo?"

La funcionalidad incluye:
- Interpretación de la consulta
- Aplicación de filtros por período si se especifican
- Cálculo del saldo a partir de ingresos y gastos
- Presentación de la información de forma amigable

### 3. Generación de Reportes

El asistente puede generar reportes de ingresos y gastos con diferentes agrupaciones.

Ejemplos:
- "Dame un reporte de gastos de este mes"
- "¿En qué he gastado más dinero este mes?"
- "Muéstrame mis ingresos del mes pasado"

La funcionalidad incluye:
- Generación de reportes por tipo (ingresos, gastos o balance)
- Agrupación por categoría o por fecha
- Cálculo de totales y promedios
- Presentación estructurada de la información

## Implementación Técnica

### Componentes Clave

1. **OpenAIToolHandler**: Maneja las llamadas a herramientas (tools) realizadas por el asistente OpenAI y ejecuta los casos de uso correspondientes.

2. **AssistantTools**: Define las especificaciones de las herramientas (tools) para OpenAI Assistant API, incluyendo:
   - `registrar_transaccion`: Para el registro de ingresos y gastos
   - `consultar_saldo`: Para consultas de saldo
   - `generar_reporte`: Para generación de reportes financieros

3. **Casos de Uso**:
   - `RegisterTransactionUseCase`: Implementa la lógica para registrar transacciones
   - `GetBalanceUseCase`: Implementa la lógica para consultar saldos
   - `GenerateReportUseCase`: Implementa la lógica para generar reportes

4. **TransactionCategoryService**: Servicio para la categorización automática de transacciones basada en el análisis de palabras clave en la descripción.

### Flujo de Procesamiento

1. El usuario envía un mensaje a través de WhatsApp
2. El mensaje es procesado por `ProcessWhatsAppMessage` 
3. El mensaje se envía al asistente de OpenAI a través de `OpenAIAssistantService`
4. Si el asistente identifica una acción financiera, llama a la herramienta correspondiente
5. `OpenAIToolHandler` ejecuta el caso de uso apropiado
6. El resultado se devuelve al asistente de OpenAI
7. El asistente genera una respuesta en lenguaje natural para el usuario
8. La respuesta se envía al usuario a través de WhatsApp

## Prueba de las Funcionalidades

Para probar las funcionalidades del asistente financiero, puedes ejecutar el script de prueba:

```bash
npx ts-node -r tsconfig-paths/register src/test-financial-assistant.ts
```

Este script realizará pruebas de todas las funcionalidades principales:
- Consulta de saldo
- Registro de gastos e ingresos
- Generación de reportes

## Limitaciones y Mejoras Futuras

1. **Categorización Avanzada**: Implementar ML para mejorar la categorización de transacciones
2. **Reportes Visuales**: Generar gráficos y tablas visuales para los reportes
3. **Presupuestos**: Permitir establecer y monitorear presupuestos por categoría
4. **Alertas**: Notificaciones sobre gastos excesivos o recordatorios de pagos
5. **Multimoneda**: Soporte para diferentes tipos de moneda y conversión
6. **Exportación**: Exportar reportes en formatos como PDF, Excel o CSV 