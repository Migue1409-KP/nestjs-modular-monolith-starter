# Autenticación y Autorización

Este template utiliza **[BetterAuth](https://better-auth.com/)**, una solución robusta y moderna para administrar desde la creación de la cuenta hasta las conexiones OAuth de manera abstracta.

## Configuración Principal

La lógica de conexión de BetterAuth reside normalmente en la carpeta `src/auth/` o mediante un archivo `better-auth.instance.ts` dependiendo de su implementación.
BetterAuth usa **Cookies httpOnly** para manejar sesiones seguras en lugar de exponer tokens JWT al cliente.

## Ventajas de no usar JWT crudo

1. **Revocación de sesión instantánea**: En una implementación JWT, a menos que uses *denylists* (caros de mantener) no puedes forzar el cierra de sesión a un dispositivo. Local Storage es vulnerable a XSS. Usar cookies administradas con DB-Session permite borrar la sesión del servidor y terminar la conexión del usuario al instante.
2. **Extensibilidad rápida**: Puedes encender "Google Login", "Magic Links", o "2FA" modificado algunos strings en la configuración mediante los plugins soportados por BetterAuth.

## Estructura de BD de BetterAuth

BetterAuth crea estas tablas base al ejecutar `npm run auth:migrate`:
- `user` (email, nombre, id principal)
- `session` (tokens de sesión activos para un usuario)
- `account` (proveedores sociales asociados, por si el usuario entra por Google y Apple al mismo tiempo).
- `verification` (tokens OTP, contraseñas temporales)

### Relación con `users/`

La tabla `user` proveniente de BetterAuth maneja exclusivamente credenciales. Las reglas pesadas de negocio, datos del perfil (avatar, preferencias, roles extendidos) pueden residir en la tabla `UserProfile` controlada por **TypeORM** en el directorio `src/users/`.
Ambas tablas pueden enlazarse usando el ID (`userId`) de la tabla de sesión o usuario desde BetterAuth.

## Endpoints Custom e Interoperabilidad

Aunque BetterAuth te regala varios endpoints (`/api/auth/sign-in`, etc.), si debes inyectar lógica de negocio customizada tras el registro, puedes usar los **Hooks (callbacks)** dentro de las opciones de the BetterAuth Instance (por ejemplo capturar en `onSessionCreate` o `onUserCreate`).

## Versiones y notas de actualización

Versiones actuales: `better-auth@1.7.x` y `@thallesp/nestjs-better-auth@2.8.x` (requiere Node ≥ 22.12 para la CLI `auth`).

- **CLI**: `@better-auth/cli` fue reemplazado por el paquete `auth`. Los scripts `npm run auth:generate` y `npm run auth:migrate` ya lo usan.
- **Cambio de email** (`user.changeEmail`): desde 1.4 se envían dos correos. `sendChangeEmailConfirmation` va al correo actual y `emailVerification.sendVerificationEmail` al nuevo. Ambos usan hoy la plantilla `CHANGE_EMAIL`; si necesitas textos distintos, crea una plantilla nueva y cambia el `templateCode`.
- **`baseURL`**: se calcula a partir de `HOST` y `PORT` (se añade `http://` si `HOST` no trae esquema). Puedes forzarla con `BETTER_AUTH_URL`; es obligatoria si despliegas detrás de un proxy con TLS.
- **Sesión fresca** (`freshAge`): desde 1.6 se mide desde la creación de la sesión, así que las operaciones sensibles pueden pedir re-login antes.
- **Passkey**: vive en el paquete `@better-auth/passkey` (hoy no se usa).
