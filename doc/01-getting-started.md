# Getting Started

Bienvenido al template base de **NestJS Modular Monolith**. Esta guía rápida te ayudará a levantar el entorno de desarrollo y entender lo básico.

## 1. Prerrequisitos

* **Node.js**: v22.12 o superior (requerido por la CLI `auth` de Better Auth 1.7).
* **NPM/Yarn/PNPM**: manejador de paquetes de tu preferencia.
* **PostgreSQL**: Servidor de base de datos local o en Docker.
* **Docker y Docker Compose** *(Opcional)*: Recomendado si quieres levantar una instancia rápida de la base de datos de manera aislada.

## 2. Variables de Entorno

Toda la configuración principal de la aplicación funciona basada en el archivo `.env`. Copia la plantilla `.env.example` y completa los valores:

```bash
cp .env.example .env
```

Asegúrate de configurar los parámetros obligatorios:
* Acceso a PostgreSQL (`DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`) y `DATABASE_URL` (la usa Better Auth).
* Claves de Better Auth (`BETTER_AUTH_SECRET`; `BETTER_AUTH_URL` es opcional) y `API_KEY` (header `api-key` exigido por el guard global).
* `FRONTEND_URL` para CORS y orígenes confiables.
* Credenciales de AWS SES (`AWS_*`) para enviar emails (magic link, cambio de correo) y de Cloudflare R2 (`R2_*`) si usas subida de archivos.

La descripción completa de cada variable está en el [README](../README.md#variables-de-entorno).

## 3. Instalación de Dependencias

```bash
npm ci
```

## 4. Ejecutar la Base de Datos

En caso de no tener una DB instalada localmente, puedes usar Docker (el repositorio incluye `docker-compose.yml` con PostgreSQL 15):

```bash
docker-compose up -d postgres
```

El mismo `docker-compose.yml` puede construir y levantar también la API (perfil opcional `app`). La imagen corre como usuario no root, incluye `config/authorization.yaml` y un `HEALTHCHECK` sobre `/<API_PREFIX>/health`; las migraciones se siguen ejecutando aparte (paso 5):

```bash
docker compose --profile app up -d --build
```

## 5. Correr Migraciones de BD

El template viene preparado con dos tipos de estructuras: TypeORM (Modelos de negocio) y BetterAuth (Modelo de autenticación/sesiones).
Sigue este orden para tener la BD al día:

```bash
# 1. Aplicar tablas de BetterAuth (users, sessions, accounts, verifications)
npm run auth:migrate

# 2. Aplicar migraciones de TypeORM (tablas de negocio)
npm run migration:run

# 3. Cargar datos base (idiomas y plantillas de notificación)
npm run seed
```

> `npm run auth:generate` solo es necesario si cambias la configuración de Better Auth (plugins, campos) y quieres regenerar su esquema.

> Para generar una nueva migración cuando cambies entidades TypeORM:
> ```bash
> # Funciona igual en Linux, macOS y Windows (PowerShell/cmd)
> npm run migration:generate -- src/core/database/migrations/NombreDeCambio
> ```

## 6. Levantar Aplicación

```bash
# Desarrollo
npm run start:dev
```

La API queda en `http://localhost:3000/api/v1` (o el puerto y `API_PREFIX` configurados). Abre [http://localhost:3000/api/v1/docs](http://localhost:3000/api/v1/docs) para ver la referencia interactiva (**Scalar**), que incluye tus endpoints y los de Better Auth. Las rutas protegidas requieren sesión y el header `api-key`.