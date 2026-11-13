# Usar este template

English version: [`en/08-using-the-template.md`](./en/08-using-the-template.md).

Guía para convertir el starter en **tu** proyecto: crearlo, renombrarlo, limpiar lo que no necesitas y quitar los módulos de ejemplo.

## 1. Crear tu repositorio

**Opción A: "Use this template" (recomendada).** En la página del repositorio pulsa **Use this template → Create a new repository**. Parte de un historial limpio, sin los commits ni tags del starter.

> Para mantenedores: este botón aparece cuando activas **Settings → General → Template repository** en el repo del starter. Es un ajuste de GitHub, no se puede versionar en el código.

**Opción B: `degit`.**

```bash
npx degit Migue1409-KP/nestjs-modular-monolith-starter mi-proyecto
cd mi-proyecto && git init
```

Después sigue el [inicio rápido](../README.md#inicio-rápido) para levantar el entorno.

## 2. Renombrar el proyecto

Busca el nombre actual con `git grep -n -i "nestjs.modular\|nestjs_template\|nestjs-template\|Migue1409"` y reemplázalo en:

| Archivo | Qué cambiar |
|---|---|
| `package.json` | `name`, `description`, `author`, `repository`, `bugs`, `homepage`, `version` (empieza en `0.1.0` o `1.0.0`) |
| `.release-please-manifest.json` | La versión inicial (debe coincidir con `package.json`) |
| `release-please-config.json` | `package-name` |
| `docker-compose.yml` | `container_name` de `postgres` y `app`, y los valores por defecto `nestjs_template` de la base |
| `src/core/database/data-source.ts` y `src/core/config/database.config.ts` | Nombre de base de datos por defecto |
| `src/main.ts` | `setTitle` / `setDescription` de OpenAPI |
| `sonar-project.properties` | `sonar.projectKey`, `sonar.projectName` (o borra el archivo y `docker-compose.sonarqube.yml` si no usas SonarQube) |
| `README.md`, `README.en.md` | Título, badges (URLs del repo), descripción |
| `LICENSE` | Titular del copyright (Apache 2.0 exige conservar la licencia y los avisos de atribución; cambia el titular si corresponde) |
| `SECURITY.md`, `CODE_OF_CONDUCT.md`, `.github/ISSUE_TEMPLATE/*` | URLs del repo y correos de contacto |

## 3. Limpiar lo que es del starter

- [ ] Reemplaza `CHANGELOG.md` por una cabecera vacía (el historial del starter no es el tuyo). release-please lo irá llenando.
- [ ] Borra `ROADMAP.md` o reemplázalo por el tuyo.
- [ ] Decide qué hacer con `agent_docs/`, `AGENTS.md` y `CLAUDE.md`: son guías para agentes de IA y útiles si los usas; bórralos si no.
- [ ] Borra `doc/en/` o `doc/` si no quieres mantener ambos idiomas.
- [ ] Genera tus propios secretos (`openssl rand -base64 32`); no reutilices los de los ejemplos.
- [ ] Revisa `config/authorization.yaml`: ahí defines qué puede hacer cada rol sobre cada recurso.
- [ ] En GitHub: activa Dependabot, protege `main` y exige que pase el job `Lint, typecheck, test, build`.

## 4. Qué módulos puedes quitar

| Módulo | ¿Se puede quitar? | Cómo |
|---|---|---|
| `src/notifications/` (administración de plantillas, rol ADMIN) | ✅ Sí, es independiente | Quita `NotificationsModule` de `AppModule` y bórralo. Elimina sus reglas de `config/authorization.yaml`. El envío de correos (`core/notification`) **no** se toca: lo usa la autenticación. |
| `src/users/` (perfiles) | ⚠️ No directamente | `AuthModule` y la fábrica de Better Auth dependen de `UsersService` (crear el perfil al registrarse y poner los roles en la sesión). Es el módulo canónico: **extiéndelo** o reemplázalo con cuidado manteniendo ese contrato. |
| `core/storage` (Cloudflare R2) | ✅ Sí | Quita `StorageModule` de los `imports` y `exports` de `CoreModule`, borra el módulo y las variables `R2_*` de `src/core/config/env.validation.ts` y `.env.example`. |
| `core/notification` + SES | ⚠️ Solo si cambias de proveedor | Hay una interfaz `MailProvider`: implementa otro proveedor en lugar de borrarlo (la autenticación por magic link necesita enviar correo). |
| Google OAuth | ✅ Sí | Quita el `socialProviders.google` en `src/auth/providers/auth-config.factory.ts` y las variables `GOOGLE_*` del esquema de entorno. |

Tras quitar un módulo ejecuta siempre:

```bash
npm run lint && npm run typecheck && npm test
```

Los tests del módulo eliminado fallarán o quedarán huérfanos; bórralos junto con el módulo y ajusta los umbrales de cobertura en `package.json` si hace falta.

## 5. Añadir tu primera funcionalidad

Sigue [05 - Añadir Nuevas Funcionalidades](./05-adding-new-features.md): usa `src/users/` como referencia y añade tus reglas a `config/authorization.yaml`.

## 6. Publicar versiones

El repositorio incluye [release-please](https://github.com/googleapis/release-please): al hacer merge de Conventional Commits en `main`, abre (y mantiene) un PR de release que sube la versión, actualiza `CHANGELOG.md` y, al fusionarlo, crea el tag `vX.Y.Z` y el release en GitHub. Para que pueda abrir PRs, activa **Settings → Actions → General → Workflow permissions → Allow GitHub Actions to create and approve pull requests**.
