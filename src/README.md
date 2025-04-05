# Estructura del Proyecto - Clean Architecture

Este proyecto sigue los principios de Clean Architecture para asegurar un código mantenible, testeable y desacoplado.

## Estructura de Carpetas

```
src/
├── core/                # Capa central - reglas de negocio
│   ├── domain/          # Entidades y reglas de negocio
│   └── usecases/        # Casos de uso que orquestan la lógica
│
├── adapters/            # Adaptadores para comunicar el core con la infraestructura
│   ├── controllers/     # Controladores de API
│   └── repositories/    # Implementaciones de repositorios
│
├── infrastructure/      # Capa externa - detalles de implementación
│   ├── config/          # Configuraciones
│   ├── database/        # Conexiones y clientes de bases de datos
│   ├── services/        # Servicios externos (WhatsApp, OpenAI, etc.)
│   └── webserver/       # Configuración del servidor web
│
└── utils/              # Utilidades generales
    ├── errors/          # Manejo centralizado de errores
    ├── validators/      # Validadores
    └── helpers/         # Funciones auxiliares
```

## Principios de Clean Architecture

1. **Independencia de frameworks**: El core de la aplicación no depende de frameworks externos.
2. **Testabilidad**: La lógica de negocio es fácilmente testeable sin dependencias externas.
3. **Independencia de UI**: La lógica de negocio funciona sin importar la interfaz de usuario.
4. **Independencia de base de datos**: Las entidades y casos de uso no dependen de la implementación de la base de datos.
5. **Independencia de agentes externos**: El núcleo no sabe nada sobre el mundo exterior.

## Flujo de dependencias

Las dependencias siempre fluyen hacia el centro:

```
[Infraestructura] -> [Adaptadores] -> [Casos de Uso] -> [Entidades]
```

Nunca el centro debe depender de capas externas. 