# Guía de Contribución

¡Gracias por considerar contribuir a wispen! Este documento proporciona las pautas y los procesos a seguir para contribuir efectivamente al proyecto.

## Flujo de Trabajo

1. **Fork del repositorio** - Crea tu propio fork del repositorio.
2. **Crea una rama** - Crea una rama para tu trabajo.
   ```
   git checkout -b feature/nombre-de-tu-caracteristica
   ```
3. **Desarrolla** - Realiza tus cambios siguiendo las convenciones de código.
4. **Prueba** - Asegúrate de que tu código pase todas las pruebas.
5. **Commit** - Haz commit de tus cambios siguiendo las convenciones de commit.
6. **Push** - Sube tus cambios a tu fork.
7. **Pull Request** - Abre un PR desde tu fork a la rama principal del repositorio original.

## Convenciones de Código

- **TypeScript**: Seguimos las mejores prácticas de TypeScript y usamos tipos estrictos.
- **Clean Architecture**: Respeta la separación de responsabilidades según la arquitectura del proyecto.
- **Formateo**: Usamos Prettier con la configuración del proyecto.
- **Linting**: Cumple con las reglas de ESLint configuradas.

## Convenciones de Commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/) para el formato de mensajes de commit:

```
<tipo>[alcance opcional]: <descripción>

[cuerpo opcional]

[pie opcional]
```

Tipos comunes:
- **feat**: Nueva característica
- **fix**: Corrección de un bug
- **docs**: Cambios en la documentación
- **style**: Cambios que no afectan el significado del código (espacios, formato, etc.)
- **refactor**: Cambio de código que no corrige un bug ni añade una característica
- **test**: Añadir o corregir tests
- **chore**: Cambios en el proceso de construcción o herramientas auxiliares

## Pull Requests

- Describe claramente el propósito y los cambios realizados.
- Incluye cualquier información contextual relevante.
- Enlaza cualquier issue relacionado usando # seguido del número del issue.
- Asegúrate de que pase todas las comprobaciones de CI.

## Reporte de Issues

Si encuentras un bug o tienes una sugerencia:

1. Revisa si ya existe un issue similar.
2. Si no existe, crea uno nuevo con:
   - Una descripción clara del problema o sugerencia
   - Pasos para reproducir el problema (si aplica)
   - Comportamiento esperado y comportamiento actual
   - Capturas de pantalla o registros si son relevantes
   - Cualquier otra información que pueda ser útil

## Preguntas o Dudas

Si tienes preguntas que no son bugs ni solicitudes de características, puedes:
- Abrir un issue con la etiqueta "question"
- Contactar directamente al equipo de desarrollo

¡Gracias por contribuir a hacer Wispen mejor! 