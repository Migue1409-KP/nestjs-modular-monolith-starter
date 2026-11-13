# Análisis y roadmap: `nestjs-modular-monolith-starter`

Análisis hecho el 2026-10-23 sobre la versión 1.0.1. Se revisaron la estructura, la configuración, auth, notificaciones, guards, Docker, tests y dependencias. También se corrieron `jest --coverage`, `npm audit` y `npm outdated`.

## Estado actual

- **Base sólida:** NestJS 11, Better Auth, RBAC multirol con YAML y `PolicyGuard`, Zod, errores RFC 9457, docs con Scalar, migraciones y seeders, y docs para agentes de IA.
- **Release:** v1.0.1, Apache 2.0, con CONTRIBUTING, SECURITY, CODE_OF_CONDUCT y plantillas de issues y PR.
- **Tests:** 70 pasan en 12 suites. La cobertura es baja: los umbrales están en 25/20/15/24 %, y el e2e usa un controlador stub, no la app real.
- **Falta de madurez para open source:** no hay `.github/workflows`, así que no hay CI. Los hooks de husky son la única barrera.

## Progreso

- ✅ **P0 (seguridad y correctitud):** completado (secretos sin fallback, validación de entorno, auditoría de dependencias, `ApiKeyGuard` en tiempo constante, helmet/throttler/shutdown hooks, TLS de BD verificado, e2e contra la app real).
- ✅ **P1 (calidad y DX):** completado el 2026-11-12 (ver detalle abajo).
- ⏳ Pendiente: P2 y las versiones v1.1 en adelante (CI, documentación en inglés, etc.).

## Hallazgos por prioridad

### P0: seguridad y correctitud (antes de promover el repo) — ✅ completado

| # | Hallazgo | Evidencia |
|---|---|---|
| 1 | **Secretos con fallback inseguro.** Si falta la variable, la app arranca con `'supersecret'` o `'default-magic-secret'`. Un starter lo copia tal cual a producción. | `auth-config.factory.ts:38,160`, `better-auth.cli.ts:14` |
| 2 | **Sin validación de variables de entorno al arrancar.** `.env.example` está lleno de `...` y nada falla si faltan DB, SES o R2. | `app.module.ts` usa `ConfigModule` sin schema |
| 3 | **`npm audit` en dependencias de producción: 51 vulnerabilidades (3 críticas, 23 altas).** Directas: `@nestjs/core`, `platform-express`, `swagger`, `axios`, `js-yaml`, `bcrypt`. Nest 11.1.6 está dos minors atrás (11.2.7). Hay que ver cuáles son transitivas y cuáles se arreglan con un update. | `npm audit --omit=dev` |
| 4 | **`ApiKeyGuard` compara con `!==`.** No es una comparación de tiempo constante. Si `API_KEY` no está definida, la guarda queda en un estado ambiguo. | `api-key.guard.ts` |
| 5 | **Sin hardening HTTP.** No hay `helmet`, rate limiting (`@nestjs/throttler`), límites de body ni `enableShutdownHooks`. | `main.ts` |
| 6 | **`rejectUnauthorized: false` con `DB_SSL=true`.** Acepta cualquier certificado. | `database.config.ts`, `data-source.ts` |
| 7 | **El e2e no prueba nada real.** Usa un `HealthController` falso, así que el wiring de guards y auth no está cubierto. | `test/app.e2e-spec.ts` |

### P1: calidad y DX — ✅ completado

> Resuelto: código muerto eliminado (`AuthService` local, `ActiveSubscriptionInterceptor`, DTO sin uso); `MailProvider` + escape de plantillas + envío de correos de auth en segundo plano; Google OAuth con scopes mínimos y sin log de perfil; `strictNullChecks` y `noImplicitAny` activos; ESLint 9 flat config + typescript-eslint 8 (`lint` sin `--fix`); migración renombrada a `InitialSchema` y `migration:generate` multiplataforma; `package.json` renombrado y skills personales fuera del repo; Dockerfile endurecido (no root, `HEALTHCHECK`, `.dockerignore`, `config/` incluido) y servicio `app` en compose; cobertura ~90 % con umbrales 80/65/70/80. Los hallazgos de abajo se conservan como registro. Detalle en `CHANGELOG.md`.

- **Código muerto o sin terminar.** Revisar cada uno antes de borrarlo:
  - `ActiveSubscriptionInterceptor` está todo comentado y no se usa.
  - `AuthService` tiene `afterSignUp` vacío, `handleAuthError` sin uso y `getUserProfileByGoogleId` que llama a Google sin token.
  - `emailOTP.sendVerificationOTP` tiene ramas vacías: el plugin está activo pero no envía nada.
  - `initializeDefaultParams` está comentado.
  - `bcrypt` no se usa en ningún lado, y `emailAndPassword` está deshabilitado.
- **Duplicación.** `handleAuthError` está copiado en `NotificationService` y `AuthService`. El nombre es engañoso en el servicio de correo.
- **Notificaciones.**
  - El envío es síncrono dentro del flujo de auth: si SES falla, falla el magic link.
  - Los placeholders se reemplazan con `RegExp` sin escapar.
  - Los parámetros no se escapan en el HTML, lo que abre riesgo de inyección en los correos.
  - SES está acoplado al servicio, mientras que storage sí tiene interfaz de proveedor.
- **Google OAuth.** Pide scopes sensibles (género, cumpleaños, direcciones) por defecto y hace `logger.log` del perfil completo. Es un problema de privacidad para un starter.
- **Typing laxo.** `strictNullChecks: false` y `noImplicitAny: false` contradicen lo que dice `AGENTS.md` ("TypeScript strict"). También hay `as any` en `main.ts`.
- **Tooling desfasado.** ESLint 8 y typescript-eslint 6 (ya van por 10 y 8). El archivo `.eslintrc.js` está deprecado. El script `lint` usa `--fix`, que no sirve para CI.
- **Migración mal nombrada.** `1778862199075-$npm_config_name.ts` salió del script `migration:generate` en Windows/PowerShell. Hay que renombrarla (con cuidado, porque ya puede estar aplicada en alguna BD) y arreglar el script.
- **Higiene del repo.** `.gitkeep` en la raíz, `skills-lock.json`, `.claude/` y `agent_docs/` conviven con la documentación pública. Conviene decidir qué es del proyecto y qué es personal. El nombre en `package.json` es `nestjs-modular-template`, pero el repo se llama `...-starter`.
- **Cobertura.** Casi 0 % en repositorios, `logging`/`request-id` interceptors, módulos de auth, storage, notificaciones (`NotificationService`) y parameters. Los umbrales están muy bajos.
- **Docker.**
  - `docker-compose.yml` solo levanta Postgres, sin la app.
  - El `Dockerfile` corre como root, sin `HEALTHCHECK` ni `.dockerignore`.
  - Hay que confirmar que `config/authorization.yaml` llega a la imagen, porque `PolicyService` lo lee en runtime.

### P2: documentación y comunidad

- La documentación está en español y el código en inglés. Eso es coherente con `AGENTS.md`, pero limita el alcance open source. Haría falta un `README.en.md` o i18n básico.
- No hay `docs/` navegable (solo 7 markdown), ni diagrama de arquitectura, ni guía de despliegue. Tampoco hay guía de "cómo usar el template" (renombrar, limpiar, eliminar módulos de ejemplo).
- No hay badges, ni "Use this template" configurado, ni Dependabot/Renovate, ni release automation (el `chore(release)` parece manual).
- La versión de Swagger está fija en `'1.0'` y no sigue `package.json`.

## Roadmap propuesto

### v1.1: "Seguro y verificable" (1-2 semanas)
Meta: que cualquiera pueda clonar el repo con confianza.
1. **CI en GitHub Actions:** lint sin `--fix`, `tsc --noEmit`, tests con cobertura y build, con Postgres como service. Más Dependabot y `npm audit` con umbral.
2. Actualizar Nest a 11.2.x y el resto de dependencias, y resolver el `audit`.
3. Validación de entorno con Zod en `ConfigModule` (falla al arrancar) y quitar los fallbacks de secretos.
4. `helmet`, throttler (con reglas más estrictas en auth), `enableShutdownHooks` y comparación de API key con `timingSafeEqual`.
5. Limpiar el código muerto: interceptor de suscripción, `bcrypt`, stubs de `AuthService`. Decidir si `emailOTP` se implementa o se quita.
6. Arreglar la migración con nombre roto, el script `migration:generate` en Windows y los scripts de lint.

### v1.2: "Testing real" (2 semanas)
1. E2E contra la app real: Postgres en CI (docker o testcontainers), con flujo de sesión simulado, RBAC por rol y health.
2. Subir umbrales de cobertura (por ejemplo 60-70 %) y cubrir `NotificationService`, storage y repositorios.
3. Activar `strictNullChecks` por fases, empezando por `shared` y `core`.
4. Migrar a ESLint flat config + typescript-eslint 8.

### v1.3: "Producción-ready" (2-3 semanas)
1. `Dockerfile` endurecido (usuario no root, `HEALTHCHECK`, `.dockerignore`), con `docker-compose` que levante app y base, y perfil de desarrollo.
2. Notificaciones: interfaz `MailProvider` (SES, SMTP/Nodemailer, consola para desarrollo), escape de HTML y placeholders, y cola/reintentos para no bloquear auth.
3. Observabilidad: logs JSON con request-id, `/health` con liveness y readiness separados, y opcionalmente OpenTelemetry y métricas Prometheus.
4. Los scopes de Google pasan a configuración opcional, sin log de perfiles.
5. Guía de despliegue (Railway, Fly.io, VPS) con `migration:run:prod` como pre-deploy.

### v1.4: "Experiencia de template" (2 semanas)
1. Script `init` o `degit` para renombrar el proyecto y limpiar ejemplos, además de activar "Template repository" en GitHub.
2. Documentación en inglés, diagrama de arquitectura, ADRs de decisiones (por qué Better Auth, YAML RBAC, Zod en vez de class-validator).
3. Mejorar el generador `create-feature` para que genere también el e2e y la entrada de política en el YAML.
4. Release automation (release-please o semantic-release) y badges.

### v2.0: "Extensible" (backlog, según demanda)
Todo opcional y modular, sin hinchar el core:
- Multi-tenancy / organizaciones (el plugin `organization` de Better Auth) y gestión de roles desde la API en vez de YAML.
- Caché (Redis), colas (BullMQ) y jobs programados.
- Auditoría de acciones, soft delete y paginación estándar en repositorios.
- Alternativas de storage (S3 puro, local) tras la interfaz existente.
- Paquete de eventos de dominio entre módulos, para reforzar la separación del monolito modular.
- Evaluar Nest 12 y Express 5 / Fastify cuando maduren.

## Decisiones pendientes

1. **Idioma open source:** ¿mantener el README y la documentación solo en español, o añadir inglés como idioma principal?
2. **Alcance de v2.0:** ¿el starter sigue mínimo, o crece con features opcionales como multi-tenancy y colas?
3. **Tests e2e:** ¿se acepta Docker/testcontainers como requisito de CI y de desarrollo local?
