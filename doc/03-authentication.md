# Autenticación y Autorización

Este template utiliza **[BetterAuth](https://better-auth.com/)**, una solución robusta y moderna para administrar desde la creación de la cuenta hasta las conexiones OAuth de manera abstracta.

## Configuración Principal

La configuración de Better Auth vive en `src/auth/providers/auth-config.factory.ts` (`AuthConfigFactory`), que registra los plugins `openAPI`, `customSession`, `magicLink` y el login con Google. `src/auth/better-auth.cli.ts` es una instancia equivalente que solo usa la CLI (`auth:generate` / `auth:migrate`); si cambias plugins o campos, actualiza **ambos** archivos.

Better Auth monta sus endpoints bajo `/<API_PREFIX>/auth/*` (por defecto `/api/v1/auth/*`) y usa **cookies httpOnly** (`better-auth.session_token`) para manejar sesiones en lugar de exponer tokens JWT al cliente. Además, el template expone `GET /api/v1/local-auth/me` (sesión actual o `null`).

Métodos habilitados: magic link y Google OAuth. Email + contraseña está deshabilitado (`emailAndPassword.enabled: false`).

## Ventajas de no usar JWT crudo

1. **Revocación de sesión instantánea**: En una implementación JWT, a menos que uses *denylists* (caros de mantener) no puedes forzar el cierra de sesión a un dispositivo. Local Storage es vulnerable a XSS. Usar cookies administradas con DB-Session permite borrar la sesión del servidor y terminar la conexión del usuario al instante.
2. **Extensibilidad rápida**: Puedes encender "Google Login", "Magic Links", o "2FA" modificado algunos strings en la configuración mediante los plugins soportados por BetterAuth.

## Estructura de BD de BetterAuth

BetterAuth crea estas tablas base al ejecutar `npm run auth:migrate`:
- `users` (email, nombre, id principal)
- `sessions` (tokens de sesión activos para un usuario)
- `accounts` (proveedores sociales asociados al usuario)
- `verifications` (tokens de magic link y verificación de email)

Los nombres están en plural porque la configuración define `modelName` para cada modelo.

### Relación con `users/`

La tabla `users` de Better Auth maneja exclusivamente credenciales e identidad. Los datos del perfil y los **roles** residen en `user_profiles` (entidad `UserProfile`, controlada por **TypeORM** en `src/users/`). Se enlazan por `user_profiles.auth_user_id` = `users.id`.

El perfil se crea con `POST /api/v1/users/profile`; `authUserId` y `email` se toman siempre de la sesión.

## Autorización (RBAC)

Tras autenticar, se decide qué puede hacer cada usuario:

1. **Roles**: se guardan en `user_profiles.roles` (`text[]`, por defecto `{USER}`; un usuario puede tener varios). Se inyectan en `session.user.roles` con el plugin `customSession`. Roles válidos: `ADMIN` y `USER` (`src/shared/authorization/constants/roles.constant.ts`).
2. **Matriz**: `config/authorization.yaml` define, por rol, los recursos y métodos HTTP permitidos. `ADMIN` tiene `*`. El recurso es el patrón de la ruta sin el prefijo global (p. ej. `users/profile/:id`). Con varios roles se evalúa la unión: basta con que uno conceda el acceso.
3. **`PolicyGuard`** (global) aplica la matriz. Responde `401` sin sesión y `403` sin permiso o sin roles. Las rutas con `@AllowAnonymous()` u `@OptionalAuth()` se saltan la comprobación. El `AuthGuard` global de la librería está desactivado (`disableGlobalAuthGuard`) porque `PolicyGuard` autentica y autoriza en una sola pasada.
4. **Propiedad de recursos**: la matriz solo ve la ruta, así que las rutas con `:id` deben verificar la propiedad en el controller (ver `assertOwnerOrAdmin` en `users.controller.ts`).
5. **API key**: independiente de la sesión; `ApiKeyGuard` exige el header `api-key` en toda ruta que no tenga `@Public()`.

Para añadir un endpoint protegido, agrega una fila a `config/authorization.yaml`; para un rol nuevo, añádelo a `ROLES` y crea su sección en el YAML.

Importa `AllowAnonymous` y `OptionalAuth` siempre desde `@/shared/decorators`, no desde la librería (una regla de ESLint lo impide).

## Endpoints Custom e Interoperabilidad

Aunque Better Auth ofrece varios endpoints (`/api/v1/auth/sign-in/...`, etc., visibles en `/api/v1/docs`), si necesitas lógica de negocio tras el registro puedes usar los **hooks** de la instancia de Better Auth (`databaseHooks`, `hooks`) dentro de `AuthConfigFactory`.

## Versiones y notas de actualización

Versiones actuales: `better-auth@1.7.x` y `@thallesp/nestjs-better-auth@2.8.x` (requiere Node ≥ 22.12 para la CLI `auth`).

- **CLI**: `@better-auth/cli` fue reemplazado por el paquete `auth`. Los scripts `npm run auth:generate` y `npm run auth:migrate` ya lo usan.
- **Cambio de email** (`user.changeEmail`): desde 1.4 se envían dos correos. `sendChangeEmailConfirmation` va al correo actual y `emailVerification.sendVerificationEmail` al nuevo. Ambos usan hoy la plantilla `CHANGE_EMAIL`; si necesitas textos distintos, crea una plantilla nueva y cambia el `templateCode`.
- **`baseURL`**: se calcula a partir de `HOST` y `PORT` (se añade `http://` si `HOST` no trae esquema). Puedes forzarla con `BETTER_AUTH_URL`; es obligatoria si despliegas detrás de un proxy con TLS.
- **Sesión fresca** (`freshAge`): desde 1.6 se mide desde la creación de la sesión, así que las operaciones sensibles pueden pedir re-login antes.
- **Passkey**: vive en el paquete `@better-auth/passkey` (hoy no se usa).
