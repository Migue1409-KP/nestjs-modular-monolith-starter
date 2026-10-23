# Changelog

Todos los cambios relevantes del proyecto. Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y versionado según [SemVer](https://semver.org/lang/es/), derivado de los tipos de commit
([Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/)).

## [2.0.0] - 2026-10-23

Actualización mayor de la autenticación: Better Auth 1.3 → 1.7 y `@thallesp/nestjs-better-auth` 2.1 → 2.8.

### ⚠️ Cambios incompatibles
- **Node.js ≥ 22.12** (antes 20.19). Actualiza `engines`, `Dockerfile` y tu entorno local.
- **CLI de Better Auth**: `@better-auth/cli` se reemplazó por el paquete `auth`. Usa `npm run auth:generate` / `npm run auth:migrate`.
- **`POST /users/profile`**: el body ya no acepta `authUserId`; siempre se toma de la sesión. Antes el schema exigía un UUID que Better Auth nunca genera.
- **`GET`/`PATCH /users/profile/:id`**: un usuario con rol `USER` solo puede acceder a su propio perfil (403 en caso contrario). `ADMIN` conserva acceso total.
- **Cambio de email**: `sendChangeEmailVerification` desapareció; ahora se usan `sendChangeEmailConfirmation` y `emailVerification.sendVerificationEmail` (dos correos, ambos con la plantilla `CHANGE_EMAIL`).
- TypeScript ≥ 5.9 y `declaration: false` en `tsconfig.json`.

### Añadido
- Plantillas de notificación base `MAGIC_LINK` y `CHANGE_EMAIL` (es/en) con seeder idempotente (`npm run seed`).
- Migración que crea la constraint única `(template, language)` de las traducciones, declarada en la entidad pero ausente en la BD.
- Variable opcional `BETTER_AUTH_URL` y cálculo automático de `baseURL` a partir de `HOST`/`PORT`.
- Tests de propiedad de perfiles, `authUserId` y conflicto de perfil duplicado.

### Corregido
- `POST /users/profile` devolvía 500 al duplicar un perfil; ahora responde 409.
- `run-seeders.ts` importaba un export inexistente que rompía el build.
- Imports muertos (`passkey`, `createAuthMiddleware`, `lastLoginMethod`) que no compilan en 1.7.

## [1.5.0] - 2026-10-22

### Añadido
- Módulo admin de notificaciones (listar, consultar, crear, reenviar y reintentar).
- Health check con sonda de conectividad a la base de datos.
- Documentación de la API con Scalar y `ApiSuccessResponse` (reemplaza swagger-ui).
- Soporte para múltiples orígenes del frontend y cookies cross-site opcionales (`COOKIE_CROSS_SITE`).
- Columnas `timestamptz`, nombre nativo e indicador de actividad en idiomas.
- Configuración de SonarQube local, `tsconfig.build.json` y script de migraciones para producción.
- `.gitattributes` para forzar finales de línea LF.

### Cambiado
- Las migraciones solo se ejecutan automáticamente en entornos desplegados y el SSL de BD es opt-in (`DB_SSL`).

### Corregido
- Se ocultan los detalles internos de errores en producción y se respeta `@Public` a nivel de clase.
- `dayjs` se importa como namespace en el storage.

## [1.4.0] - 2026-06-30

### Añadido
- Proveedor de almacenamiento Cloudflare R2 con URLs prefirmadas.
- Constraint única de plantilla + idioma en las traducciones de notificaciones.

## [1.3.0] - 2026-05-15

### Añadido
- Autorización basada en políticas: matriz RBAC en YAML, `PolicyGuard` y roles múltiples.
- Mock manual de Jest para `@thallesp/nestjs-better-auth` (paquetes solo ESM).

### Cambiado
- `.gitignore` incluye los archivos JSON locales de Claude.

## [1.2.0] - 2026-03-21

### Añadido
- Skills con plantillas de features CRUD para NestJS.

### Cambiado
- Configuración de base de datos simplificada y repositorios de notificaciones y plantillas unificados.

## [1.1.0] - 2026-02-28

### Añadido
- Decoradores de manejo de errores, filtros de validación, interceptor de suscripción activa y mejoras de configuración.
- Perfil de usuario con soporte de idiomas y mejor manejo de errores.
- Configuración de base de datos por variables de entorno y seeders de idiomas y países.
- ESLint, Prettier, Husky y lint-staged.
- `Dockerfile` y `docker-compose.yml` para desarrollo.
- Pruebas unitarias y de integración para filtros, interceptores y pipes.
- Documentación de arranque, arquitectura, autenticación, migraciones y seeders, además de guías para agentes.

## [1.0.0] - 2025-10-15

### Añadido
- Plantilla inicial del monolito modular NestJS.

[2.0.0]: https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/compare/v1.5.0...v2.0.0
[1.5.0]: https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/releases/tag/v1.0.0
