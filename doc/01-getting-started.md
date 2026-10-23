# Getting Started

Bienvenido al template base de **NestJS Modular Monolith**. Esta guía rápida te ayudará a levantar el entorno de desarrollo y entender lo básico.

## 1. Prerrequisitos

* **Node.js**: v22.12 o superior (requerido por la CLI `auth` de Better Auth 1.7).
* **NPM/Yarn/PNPM**: manejador de paquetes de tu preferencia.
* **PostgreSQL**: Servidor de base de datos local o en Docker.
* **Docker y Docker Compose** *(Opcional)*: Recomendado si quieres levantar una instancia rápida de la base de datos de manera aislada.

## 2. Variables de Entorno

Toda la configuración principal de la aplicación funciona basada en el archivo `.env`. Copia `.env.example` (si está presente) o crea uno desde cero:

```bash
cp .env.example .env
```

Asegúrate de configurar los parámetros obligatorios:
* Acceso a PostgreSQL (`DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`).
* Claves de BetterAuth (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`).
* Claves para AWS SES o el servicio de notificaciones dependiendo el implementado en local.

## 3. Instalación de Dependencias

```bash
npm install
```

## 4. Ejecutar la Base de Datos

En caso de no tener una DB instalada localmente, puedes usar Docker (requiere que el template cuente con \`docker-compose.yml\` configurado):

```bash
docker-compose up -d postgres
```

## 5. Correr Migraciones de BD

El template viene preparado con dos tipos de estructuras: TypeORM (Modelos de negocio) y BetterAuth (Modelo de autenticación/sesiones).
Sigue este orden para tener la BD al día:

```bash
# 1. Sincronizar el schema de BetterAuth
npm run auth:generate

# 2. Aplicar tablas de BetterAuth
npm run auth:migrate

# 3. Aplicar migraciones de TypeORM (tablas de negocio)
npm run migration:run
```

> Para generar una nueva migración cuando cambies entidades TypeORM:
> ```bash
> # Linux/Mac/Git Bash
> npm run migration:generate --name=NombreDeCambio
>
> # Windows (cmd)
> set npm_config_name=NombreDeCambio && npm run migration:generate
> ```

## 6. Levantar Aplicación

```bash
# Desarrollo
npm run start:dev
```

Abre [http://localhost:3000/docs](http://localhost:3000/docs) (o el puerto configurado) para ver la API interactiva en **Swagger UI**.