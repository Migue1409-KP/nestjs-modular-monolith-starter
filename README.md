# NestJS Modular Monolith Starter

[![Licencia: Apache 2.0](https://img.shields.io/badge/licencia-Apache%202.0-blue.svg)](./LICENSE)
[![Release](https://img.shields.io/github/v/release/Migue1409-KP/nestjs-modular-monolith-starter?sort=semver)](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/releases)
[![Node](https://img.shields.io/badge/node-%E2%89%A5%2022.12-339933.svg)](https://nodejs.org)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E.svg)](https://nestjs.com)

Template base para proyectos en **NestJS**, diseñado para escalar como un **monolito modular**. Ofrece una base lista para producción con autenticación moderna, autorización por roles, base de datos relacional, validación, trazabilidad, notificaciones por email y documentación interactiva de la API.

## Características

- 🔐 **Autenticación con Better Auth**: sesiones por cookie, magic link, email OTP y Google OAuth.
- 🛡️ **Autorización por roles (RBAC)** definida en YAML, con roles `USER` y `ADMIN` y comprobación de propiedad de recursos.
- 🗄️ **PostgreSQL + TypeORM** con migraciones y seeders idempotentes.
- ✅ **Validación con Zod** y errores estándar **RFC 9457 (Problem Details)**.
- 📚 **Documentación interactiva con Scalar** que incluye tanto tus endpoints como los de Better Auth.
- 📬 **Notificaciones por email** (AWS SES) con plantillas multi-idioma.
- ☁️ **Subida de archivos** a Cloudflare R2 mediante presigned URLs.
- 🔎 Logging estructurado con `requestId`, health check y trazabilidad por petición.
- 🧪 Tests con Jest, Husky + commitlint + lint-staged, Docker y soporte para SonarQube.

## Stack tecnológico

| Herramienta | Rol |
|---|---|
| **NestJS 11 + Express + TypeScript** | Framework principal, estructura feature-first |
| **PostgreSQL + TypeORM** | Base de datos relacional con migraciones |
| **Better Auth** (+ `@thallesp/nestjs-better-auth`) | Autenticación y sesiones |
| **Zod** | Validación de DTOs mediante pipes personalizados |
| **Winston** | Logging estructurado |
| **OpenAPI + Scalar** | Documentación interactiva en `/api/v1/docs` |
| **AWS SES** | Envío de emails desde el módulo de notificaciones |
| **Cloudflare R2** | Almacenamiento de archivos con presigned URLs |
| **Docker** | Base de datos local |

## Requisitos

- **Node.js ≥ 22.12** (la CLI `auth` de Better Auth 1.7 lo exige). Con nvm: `nvm use 22`.
- **PostgreSQL 15+** (local o con Docker).
- npm.

## Inicio rápido

```bash
# 1. Dependencias
npm ci

# 2. Variables de entorno
cp .env.example .env        # y completa los valores (ver tabla más abajo)

# 3. Base de datos
docker-compose up -d postgres

# 4. Esquema y datos base
npm run auth:migrate        # tablas de Better Auth (users, sessions, accounts, verifications)
npm run migration:run       # migraciones de TypeORM
npm run seed                # idiomas y plantillas de notificación

# 5. Arrancar
npm run start:dev
```

La API queda en `http://localhost:3000/api/v1` y la documentación en `http://localhost:3000/api/v1/docs`.

> Si cambias el esquema de Better Auth (plugins, campos), vuelve a ejecutar `npm run auth:generate` y `npm run auth:migrate`. Para cambios en entidades TypeORM: `npm run migration:generate --name=DescripcionDelCambio` y `npm run migration:run`.

## Variables de entorno

Las completas en `.env` (plantilla en [`.env.example`](./.env.example)).

| Variable | Descripción |
|---|---|
| `PORT`, `HOST`, `API_PREFIX` | Puerto, host y prefijo global (por defecto `api/v1`) |
| `NODE_ENV` | `development`, `staging` o `production` |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | Conexión de TypeORM |
| `DB_SSL` | `true` si tu proveedor de BD exige SSL |
| `DATABASE_URL` | Cadena de conexión que usa Better Auth |
| `BETTER_AUTH_SECRET` | Secreto largo y aleatorio (obligatorio en producción) |
| `BETTER_AUTH_URL` | *Opcional.* Origen público sin ruta (por defecto `HOST:PORT`); necesario tras un proxy con TLS |
| `MAGIC_LINK_TOKEN_LENGTH`, `MAGIC_LINK_SECRET` | Generación de tokens del magic link |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Login con Google |
| `API_KEY` | Clave exigida en el header `api-key` por el guard global |
| `FRONTEND_URL` | Origen(es) del frontend, separados por coma (CORS y orígenes confiables) |
| `COOKIE_CROSS_SITE`, `DOMAIN` | `true` si el frontend vive en otro sitio; `DOMAIN` habilita cookies entre subdominios |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SES_SENDER` | Envío de emails con SES |
| `R2_*` | Cloudflare R2 (cuenta, claves, bucket y URL pública) |
| `LOG_LEVEL` | Nivel de Winston |

## Autenticación y autorización

- **Autenticación**: Better Auth monta sus endpoints en `/api/v1/auth/*` (magic link, email OTP, Google, sesiones, cambio de email…). La sesión viaja en la cookie `better-auth.session_token`.
- **Roles**: se guardan en `user_profiles.roles` (por defecto `USER`) y se inyectan en la sesión con `customSession`.
- **Autorización**: `PolicyGuard` evalúa la matriz de [`config/authorization.yaml`](./config/authorization.yaml) por recurso y método HTTP. Las rutas con `@AllowAnonymous()` u `@OptionalAuth()` se saltan la comprobación.
- **Propiedad de recursos**: un `USER` solo accede a su propio perfil (`/users/profile/:id`); `ADMIN` accede a todo.
- **API key**: las rutas no marcadas con `@Public()` exigen el header `api-key`.

Más detalle en [`doc/03-authentication.md`](./doc/03-authentication.md).

## Documentación de la API

Con la aplicación levantada:

| Recurso | URL |
|---|---|
| Referencia interactiva (Scalar): endpoints propios **y** de Better Auth | `http://localhost:3000/api/v1/docs` |
| Referencia nativa de Better Auth | `http://localhost:3000/api/v1/auth/reference` |
| OpenAPI JSON / YAML (solo `development` y `staging`) | `/api/v1/download/openapi.json` · `/api/v1/download/openapi.yaml` |

En Scalar puedes probar las peticiones directamente (*Test Request*). Para las rutas protegidas inicia sesión primero y envía el header `api-key`.

## Scripts útiles

| Script | Descripción |
|---|---|
| `npm run start:dev` | Servidor en modo watch |
| `npm run build` / `npm run start:prod` | Compilar y ejecutar `dist/` |
| `npm run lint` · `npm run format` | ESLint (con `--fix`) y Prettier |
| `npm test` · `test:watch` · `test:cov` · `test:e2e` | Tests unitarios, cobertura y e2e |
| `npm run auth:generate` · `auth:migrate` | Esquema de Better Auth |
| `npm run migration:generate` · `migration:run` · `migration:revert` | Migraciones TypeORM |
| `npm run seed` | Idiomas y plantillas de notificación |

## Estructura del proyecto

```text
src/
 app.module.ts        # Módulo raíz
 main.ts              # Bootstrap, OpenAPI/Scalar, guards, pipes e interceptores globales
 auth/                # Integración con Better Auth y endpoints custom
 core/                # Infraestructura: DB, logger, HTTP, notificaciones, parámetros, storage, health
 notifications/       # Administración de notificaciones (rol ADMIN)
 shared/              # Decoradores, filtros, guards, interceptores, pipes, autorización
 users/               # Dominio de ejemplo: perfiles, repositorio, servicio, controller
config/                # Matriz de autorización (YAML)
doc/                   # Documentación detallada (español)
agent_docs/            # Guías para agentes de IA
```

## Documentación interna

- [01 - Getting Started](./doc/01-getting-started.md)
- [02 - Arquitectura y Estructura](./doc/02-architecture-and-structure.md)
- [03 - Autenticación (Better Auth)](./doc/03-authentication.md)
- [04 - Base de Datos y Migraciones](./doc/04-database-and-migrations.md)
- [05 - Añadir Nuevas Funcionalidades](./doc/05-adding-new-features.md)
- [06 - Git y Commits Semánticos](./doc/06-git-conventional-commits.md)

## Versionado

Seguimos [SemVer](https://semver.org/lang/es/). El historial de cambios está en el [CHANGELOG](./CHANGELOG.md) y las versiones publicadas en [Releases](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/releases).

## Contribuir

Lee la [guía de contribución](./CONTRIBUTING.md) y el [Código de Conducta](./CODE_OF_CONDUCT.md). Para reportar vulnerabilidades sigue la [Política de seguridad](./SECURITY.md).

## Licencia

Distribuido bajo la licencia [Apache 2.0](./LICENSE).
