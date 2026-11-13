# Changelog

Todos los cambios relevantes del proyecto. Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y versionado según [SemVer](https://semver.org/lang/es/), derivado de los tipos de commit
([Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/)).

## [1.1.0](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/compare/nestjs-modular-monolith-starter-v1.0.1...nestjs-modular-monolith-starter-v1.1.0) (2026-11-13)


### Features

* add Jest manual mock for thallesp/nestjs-better-auth to support testing with ESM-only packages ([fa5cf27](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/fa5cf272da80a0998a99360888833b21a750eaca))
* **api:** add error handling decorators, validation filters, active subscription interceptor, and configuration improvements ([4c818dd](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/4c818dddb7678e52c1bd677be470def07194b60c))
* **config:** add ESLint and Prettier configuration files, update package.json scripts, and remove unused dependencies ([92b7bde](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/92b7bde412e1e7f5c578002c211b47d865ad16ea))
* **config:** support multiple frontend origins and opt-in cross-site cookies ([54959b3](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/54959b3ad628784515bafa21f5ca99926f02e1da))
* **database:** refactor database configuration to use environment variables and add seeders for languages and countries ([54daea6](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/54daea6c6dc402d107d41d12eb219299730d05d6))
* **db:** use timestamptz columns and add native name and active flag to languages ([514e7dc](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/514e7dc91809a5229b8384a46f3171f97c5ea458))
* **docker:** agregar Dockerfile y docker-compose.yml para la configuración del entorno de desarrollo ([0fd4da5](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/0fd4da5e2e88c3782520dc6447cb6ed0df3f6d6d))
* **docs:** actualizar instrucciones en README para incluir la aplicación de seeders antes de arrancar la aplicación ([5920f76](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/5920f7653f7e290effc89be8ae06252e0d0b1672))
* **docs:** add comprehensive documentation for project setup, architecture, authentication, database migrations, and seeders ([4935b0c](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/4935b0cd659c0eaa1c306afb1dda98aecd99c417))
* **docs:** add documentation for agents, exploration guides, and feature workflow ([2b09b08](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/2b09b08d3f4f6f6e45e778dfc5a55921f378488f))
* **docs:** include Better Auth endpoints in the Scalar API reference ([bb02998](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/bb02998e265b563ec2fd38a01b261470b2cebe54))
* **docs:** read OpenAPI version from package.json ([48132e4](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/48132e4a824ae46891c526948bcb87db86246283))
* **docs:** replace swagger-ui with scalar API reference and add ApiSuccessResponse ([50faccf](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/50faccf66b900071bbb88961a3da5f55bff4cf29))
* **health:** add health check module with database connectivity probe ([8de0979](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/8de0979e87661898cab2c591f28c837a5aa21280))
* integrate policy-based authorization system ([753d0c8](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/753d0c8b6c734a9ed3973b659702d25043fa4e0a))
* **notification:** add unique constraint for template and language in translations ([0f12565](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/0f12565fc0d01411442eec226d43433e73f1c515))
* **notifications:** add admin module to manage notifications ([fb3d56c](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/fb3d56c9f9121a256522fc948f2945bce24c8edb))
* **notifications:** seed MAGIC_LINK and CHANGE_EMAIL templates ([b521dc9](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/b521dc9aad7c42ba180e658ac33793df3adde27b))
* **security:** add helmet, rate limiting and shutdown hooks ([019c984](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/019c984c7585f7a0d7e150d91bf0e7f88227003e))
* **skills:** add Nest.js feature templates for CRUD operations ([bda81a5](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/bda81a5e07ee81b3ef53e560c87a6a4ced09e38e))
* **storage:** implement Cloudflare R2 storage provider with presigned URLs ([cf9ebcd](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/cf9ebcda2f9e52bf7d49606e72d8c6b68b07c46f))
* **tests:** agregar pruebas unitarias y de integración para filtros, interceptores y pipes ([77f4fec](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/77f4fec5541279f883b706d03c4cee522f2b207f))
* **users:** enhance user profile management with language support and improved error handling ([1bcc0f0](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/1bcc0f0f640bce151ec0c65a60e4d9b0eb0bf1fd))


### Bug Fixes

* **auth:** remove insecure secret fallbacks ([6528391](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/6528391cfa59b58ddd1a34207dbf9c4470098feb))
* **auth:** request minimal Google scopes and stop logging profiles ([b836d75](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/b836d750d08eefe012f85b0e46b0ce2a2d0699c9))
* **config:** validate environment variables at startup ([e242013](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/e242013d0fe869435e89287f8eec63887762b418))
* **db:** verify the database TLS certificate by default ([05d3eeb](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/05d3eeb2599f399190e8cb6ded83aebccf181e58))
* **security:** compare API key in constant time ([6b65568](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/6b65568a8a2d68315e47a93f83d265e511e123ee))
* **security:** hide internal error details in production and honor class-level @Public ([b3f8d35](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/b3f8d358fbec726c764dfbd7e27c18cf2a6fefe1))
* **storage:** use namespace import for dayjs ([f800b93](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/f800b93101f8df69fdd41d02ae6383eda350472e))
* **users:** enforce profile ownership on GET/PATCH /users/profile/:id ([eb70649](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/eb706491fbcc3f5ac0bbf498f595ae67f21dd04a))
* **users:** take authUserId from the session and return 409 on duplicate profile ([3c9c5c0](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/commit/3c9c5c006bc7748e63b24550dce43edd2642c14a))

## [Sin publicar]

### Documentación
- `README.en.md` y `doc/en/` (índice, despliegue y uso del template) en inglés; nuevo índice `doc/README.md`.
- Diagramas Mermaid de módulos y de ciclo de vida de una petición en `doc/02-architecture-and-structure.md`.
- Guías `07 - Despliegue` (Docker, Railway, Fly.io, VPS, migraciones como pre-deploy) y `08 - Usar este template` (renombrar, limpiar y quitar módulos de ejemplo).

### CI y automatización
- Workflow de CI en GitHub Actions: lint, typecheck, tests con cobertura, build y e2e contra Postgres; auditoría de dependencias informativa.
- Dependabot (npm, Docker y GitHub Actions, semanal y agrupado) y release-please para versionado, CHANGELOG, tags y releases automáticos.
- `.nvmrc` pasa a `22.12.0` (coincide con `engines`).

### API
- La `version` del documento OpenAPI se lee de `package.json` en lugar de estar fija en `1.0`.

### Seguridad
- Google OAuth ya no pide por defecto scopes sensibles (género, cumpleaños, direcciones) ni acceso `offline`, y deja de registrar el perfil completo en los logs. Los scopes extra son opt-in con `GOOGLE_SCOPES`.
- Las plantillas de notificación reemplazan los placeholders en una sola pasada (sin `RegExp` con claves sin escapar) y escapan HTML en los valores de los cuerpos HTML, evitando inyección de marcado en los correos.

### Tests
- Tests unitarios nuevos para `NotificationService`, el render de plantillas, `SesMailProvider`, `StorageService`, `CloudflareR2Provider`, los repositorios (usuarios, idiomas, notificaciones, plantillas y traducciones), `LoggingInterceptor`, `RequestIdInterceptor`, `@Transactional`, `ParametersService`, `StorageController`, `AuthController` y `getDatabaseConfig`: de 70 a 199 tests y cobertura global ~90 % (antes ~44 %).
- Umbrales de cobertura: de 25/20/15/24 % a 80/65/70/80 % (statements/branches/functions/lines). Se excluyen de la medición los archivos de cableado o arranque (módulos, `main.ts`, migraciones, seeders, `data-source.ts`, `better-auth.cli.ts`).

### Tooling
- ESLint 8 + typescript-eslint 6 pasan a ESLint 9 + typescript-eslint 8 con flat config (`eslint.config.mjs`, reemplaza al `.eslintrc.js` deprecado). El repo queda sin warnings.
- `npm run lint` ya no usa `--fix` y falla con cualquier warning (apto para CI); la autocorrección está en `npm run lint:fix`. Nuevo `npm run typecheck`.

### TypeScript
- Se activan `strictNullChecks` y `noImplicitAny` (junto con el `strict` que ya estaba declarado; `strictPropertyInitialization` queda desactivado por las entidades TypeORM y los DTO). Se añade `@types/js-yaml`.
- `UsersService.findByAuthUserId` devuelve `null` cuando el usuario no tiene perfil (antes devolvía `{ provider }`), de acuerdo con el contrato `UserProfile | null` que ya declaraba `GET /users/profile`.
- Corregido: el nombre mostrado en Better Auth ya no incluye `null`/`undefined` cuando el perfil no tiene apellido.

### Docker
- El `Dockerfile` ahora copia `config/authorization.yaml` a la imagen (sin él `PolicyService` no arrancaba), corre como usuario `node` (no root), define un `HEALTHCHECK` sobre `/health`, instala dependencias con `--ignore-scripts` (el `prepare` de husky rompía `npm ci --omit=dev`) y se acompaña de un `.dockerignore`.
- `docker-compose.yml` incorpora el servicio `app` bajo el perfil opcional `app` (`docker compose --profile app up -d --build`); por defecto sigue levantando solo Postgres.

### Eliminado
- Código muerto: `AuthService` local (stubs `afterSignUp`, `getUserProfileByGoogleId` y `handleAuthError`), `ActiveSubscriptionInterceptor`, los DTO `login`/`register` sin uso y el `.gitkeep` de la raíz.
- `skills-lock.json` y los skills personales `better-auth-best-practices` y `nestjs-expert` salen del control de versiones (siguen en `.gitignore`); `create-feature` se mantiene.
- Plugin `emailOTP` de Better Auth (nunca envió códigos: `sendVerificationOTP` estaba vacío) y sus endpoints `/auth/email-otp/*`.
- Endpoint de prueba `GET /parameters/test`.

### Cambiado
- Notificaciones: el envío por SES vive detrás de la interfaz `IMailProvider` (token `MAIL_PROVIDER`, implementación `SesMailProvider`), igual que storage. `NotificationService` ya no conoce SES ni duplica `handleAuthError`, y se eliminó el `initializeDefaultParams` vacío.
- Los correos de Better Auth (magic link, cambio de email) se entregan en segundo plano con `NotificationService.notify`: si SES falla, el flujo de auth no falla; la notificación queda `FAILED` y se reintenta desde el módulo admin.
- ⚠️ La migración inicial `$npmConfigName1778862199075` pasa a llamarse `InitialSchema1778862199075` (archivo, clase y `name`). Las bases de datos ya migradas deben actualizar el registro: `UPDATE migrations SET name = 'InitialSchema1778862199075' WHERE name = ' $npmConfigName1778862199075';` (o recrearse si no importa su contenido).
- `migration:generate` ahora recibe la ruta como argumento y funciona igual en Windows, macOS y Linux: `npm run migration:generate -- src/core/database/migrations/Nombre`.
- El `name` de `package.json` pasa a `nestjs-modular-monolith-starter`.
- Documentación alineada con el código: `doc/`, `agent_docs/`, `AGENTS.md` y el README de seeders describen ahora la autorización RBAC (`PolicyGuard`, `config/authorization.yaml`), el pipeline real de guards/interceptores, las variables `DB_*` vigentes (sin `DB_SYNCHRONIZE`), el flujo `auth:migrate` → `migration:run` → `seed` y Scalar en `/api/v1/docs`.
- El README de seeders ya no hace referencia a seeders y datos de otro proyecto.

## [1.0.1] - 2026-10-23

### Añadido
- Plantillas de GitHub para issues (bug y mejora) y pull requests; los reportes de seguridad se redirigen al reporte privado.

### Cambiado
- El README ya no lista `/api/v1/auth/reference`: los endpoints de Better Auth se consultan en `/api/v1/docs`.

## [1.0.0] - 2026-10-23

Primera versión estable. Actualización mayor de la autenticación: Better Auth 1.3 → 1.7 y `@thallesp/nestjs-better-auth` 2.1 → 2.8.

### ⚠️ Cambios incompatibles
- **Node.js ≥ 22.12** (antes 20.19). Actualiza `engines`, `Dockerfile` y tu entorno local.
- **CLI de Better Auth**: `@better-auth/cli` se reemplazó por el paquete `auth`. Usa `npm run auth:generate` / `npm run auth:migrate`.
- **`POST /users/profile`**: el body ya no acepta `authUserId`; siempre se toma de la sesión. Antes el schema exigía un UUID que Better Auth nunca genera.
- **`GET`/`PATCH /users/profile/:id`**: un usuario con rol `USER` solo puede acceder a su propio perfil (403 en caso contrario). `ADMIN` conserva acceso total.
- **Cambio de email**: `sendChangeEmailVerification` desapareció; ahora se usan `sendChangeEmailConfirmation` y `emailVerification.sendVerificationEmail` (dos correos, ambos con la plantilla `CHANGE_EMAIL`).
- TypeScript ≥ 5.9 y `declaration: false` en `tsconfig.json`.
- **Licencia**: el proyecto pasa de MIT a **Apache 2.0**.

### Añadido
- Los endpoints de Better Auth (sign-in, sesiones, magic link, OTP…) aparecen en la referencia interactiva de Scalar `/api/v1/docs` y en `openapi.json/yaml`, además de `/api/v1/auth/reference`.
- Archivos de comunidad: `LICENSE` (Apache 2.0), `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md` y `SECURITY.md`.
- README renovado (variables de entorno reales, autenticación, documentación de la API, scripts) y metadatos de `package.json` (repositorio, bugs, homepage, autor).
- Plantillas de notificación base `MAGIC_LINK` y `CHANGE_EMAIL` (es/en) con seeder idempotente (`npm run seed`).
- Migración que crea la constraint única `(template, language)` de las traducciones, declarada en la entidad pero ausente en la BD.
- Variable opcional `BETTER_AUTH_URL` y cálculo automático de `baseURL` a partir de `HOST`/`PORT`.
- Tests de propiedad de perfiles, `authUserId` y conflicto de perfil duplicado.

### Corregido
- `BETTER_AUTH_URL` solo usa el origen (la ruta la aporta `basePath`).
- `docker-compose.yml` y la documentación usaban `DB_DATABASE` en lugar de `DB_NAME`.
- `POST /users/profile` devolvía 500 al duplicar un perfil; ahora responde 409.
- `run-seeders.ts` importaba un export inexistente que rompía el build.
- Imports muertos (`passkey`, `createAuthMiddleware`, `lastLoginMethod`) que no compilan en 1.7.

## [0.1.5] - 2026-10-22

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

## [0.1.4] - 2026-06-30

### Añadido
- Proveedor de almacenamiento Cloudflare R2 con URLs prefirmadas.
- Constraint única de plantilla + idioma en las traducciones de notificaciones.

## [0.1.3] - 2026-05-15

### Añadido
- Autorización basada en políticas: matriz RBAC en YAML, `PolicyGuard` y roles múltiples.
- Mock manual de Jest para `@thallesp/nestjs-better-auth` (paquetes solo ESM).

### Cambiado
- `.gitignore` incluye los archivos JSON locales de Claude.

## [0.1.2] - 2026-03-21

### Añadido
- Skills con plantillas de features CRUD para NestJS.

### Cambiado
- Configuración de base de datos simplificada y repositorios de notificaciones y plantillas unificados.

## [0.1.1] - 2026-02-28

### Añadido
- Decoradores de manejo de errores, filtros de validación, interceptor de suscripción activa y mejoras de configuración.
- Perfil de usuario con soporte de idiomas y mejor manejo de errores.
- Configuración de base de datos por variables de entorno y seeders de idiomas y países.
- ESLint, Prettier, Husky y lint-staged.
- `Dockerfile` y `docker-compose.yml` para desarrollo.
- Pruebas unitarias y de integración para filtros, interceptores y pipes.
- Documentación de arranque, arquitectura, autenticación, migraciones y seeders, además de guías para agentes.

## [0.1.0] - 2025-10-15

### Añadido
- Plantilla inicial del monolito modular NestJS.

[Sin publicar]: https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/compare/v0.1.5...v1.0.0
[0.1.5]: https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/releases/tag/v0.1.0
