# Base de Datos y TypeORM

El persistente almacenamiento de información, configuración y perfiles estáticos de la aplicación lo provee **PostgreSQL** montado sobre el ORM **TypeORM**.

## Flujo Completo para Tener la BD al Día

Cada vez que inicias el proyecto desde cero (o hay cambios en el schema), ejecuta en este orden:

```bash
# 1. Aplica las tablas de BetterAuth (users, sessions, accounts, verifications)
npm run auth:migrate

# 2. Aplica las migraciones de TypeORM (tablas de negocio: user_profiles, etc.)
npm run migration:run

# 3. Carga datos base (idiomas y plantillas de notificación; idempotente)
npm run seed

# 4. Inicia la aplicación
npm run start:dev
```

> **Nota:** Los pasos 1 a 3 son obligatorios al arrancar el proyecto por primera vez. `npm run auth:generate` (regenera el esquema de Better Auth) solo hace falta si cambias sus plugins o campos, y `npm run migration:generate --name=DescripcionDelCambio` solo cuando modificas entidades TypeORM.

---

## Variables de Conexión

En `.env` se definen las variables:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=secret
DB_NAME=nestjs_template
DB_SSL=false
# Cadena de conexión que usa Better Auth (apunta a la misma base)
DATABASE_URL=postgresql://postgres:secret@localhost:5432/nestjs_template
```

`DB_SSL=true` activa SSL si tu proveedor de BD lo exige (no depende de `NODE_ENV`).

⚠️ **NOTA:** no existe una variable `DB_SYNCHRONIZE`. La aplicación activa `synchronize` de TypeORM automáticamente cuando `NODE_ENV` **no** es `production` ni `staging` (cómodo en local, pero puede alterar el esquema sin migraciones). En `production` y `staging` solo se usan migraciones, que se aplican de forma explícita (nunca al arrancar). El CLI de migraciones (`data-source.ts`) siempre tiene `synchronize: false`.

## Migraciones en TypeORM

Toda alteración de esquema relacional en entidades decoradas (modelos de negocio) debe quedar registrada en una **migración** (`src/core/database/migrations/`). Las entidades se descubren por patrón (`**/*.entity.ts`), por lo que nombra los archivos con el sufijo `.entity.ts`.

### 1. Generar una Migración

Supongamos que modificas la entidad `Language` para agregar una nueva columna llamada `codeIso`:

```bash
# Linux/Mac/Git Bash
npm run migration:generate --name=AddCodeIsoToLanguages

# Windows (cmd)
set npm_config_name=AddCodeIsoToLanguages && npm run migration:generate
```

El script lee `data-source.ts`, carga tus entidades y las compara con la base de datos, generando un SQL de tipo `ALTER TABLE`.

### 2. Ejecutar Migraciones Nuevas

Una vez confirmado y revisado el archivo generado en `src/core/database/migrations/`:

```bash
npm run migration:run
```

### 3. Reversión

Si una migración falla o debes deshacerla, revierte la última aplicada:

```bash
npm run migration:revert
```

### 4. Producción

En el entorno compilado usa `npm run migration:run:prod` (ejecuta las migraciones desde `dist/`), por ejemplo como comando previo al despliegue.

## Seeders

`npm run seed` carga datos base de forma idempotente (idiomas `es`/`en` y plantillas de notificación `MAGIC_LINK` y `CHANGE_EMAIL`). Ejecútalo después de `migration:run`. Más detalle en `src/core/database/seeders/README.md`.

## Repositorios Custom 

Es una excelente práctica no depender directamente de EntityManagers injectados o llamadas nativas sueltas. En `src/users/repositories/` y en `src/core/notification/repositories/` notarás clases personalizadas. Inyecta este Repositorio en lugar del genérico, ya que proporciona un único punto para cambiar, optimizar o testear la manera de recuperar datos para una entidad.