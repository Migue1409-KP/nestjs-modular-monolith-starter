# Despliegue

English version: [`en/07-deployment.md`](./en/07-deployment.md).

Esta guía cubre cómo llevar la API a producción con la imagen Docker del repositorio. Los pasos son los mismos en cualquier proveedor: **construir la imagen → configurar variables → migrar la base de datos → arrancar**.

## 1. Qué trae la imagen

El [`Dockerfile`](../Dockerfile) es multi-stage: compila en una etapa y la imagen final solo contiene `dist/`, las dependencias de producción y `config/authorization.yaml`. Corre como usuario `node` (no root), expone el puerto `3000` y define un `HEALTHCHECK` sobre `GET /<API_PREFIX>/health` (por defecto `/api/v1/health`).

> La imagen **no** incluye dependencias de desarrollo. Por eso dentro del contenedor solo puedes ejecutar `npm run migration:run:prod`; `auth:migrate` y `seed` necesitan `ts-node` y la CLI `auth` (ver [paso 3](#3-migraciones-y-datos-base)).

## 2. Variables de entorno de producción

La app **no arranca** si faltan las obligatorias (se validan con Zod). Con `NODE_ENV=production` también son obligatorias `GOOGLE_*`, `AWS_*` y `R2_*`. Referencia completa en el [README](../README.md#variables-de-entorno).

| Variable | Valor recomendado |
|---|---|
| `NODE_ENV` | `production` |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `DATABASE_URL` | Los de tu base de datos gestionada |
| `DB_SSL` | `true` si el proveedor exige TLS (se verifica el certificado; usa `DB_SSL_CA` para una CA propia) |
| `BETTER_AUTH_SECRET`, `MAGIC_LINK_SECRET` | `openssl rand -base64 32` (mín. 32 caracteres) |
| `API_KEY` | `openssl rand -base64 24` (mín. 16 caracteres) |
| `BETTER_AUTH_URL` | Origen público **con https** y sin ruta, p. ej. `https://api.example.com` |
| `FRONTEND_URL` | Origen(es) del frontend para CORS, separados por coma |
| `TRUST_PROXY` | `1` si hay un proxy delante (Railway, Fly.io, Caddy/Nginx) para que el rate limiting vea la IP real |
| `COOKIE_CROSS_SITE`, `DOMAIN` | Según dónde viva el frontend (ver README) |

## 3. Migraciones y datos base

Hay tres operaciones sobre la base de datos y cada una necesita herramientas distintas:

| Paso | Comando | ¿Dentro de la imagen de producción? |
|---|---|---|
| Migraciones de TypeORM | `npm run migration:run:prod` | ✅ Sí (usa `dist/`) |
| Esquema de Better Auth | `npm run auth:migrate -- --yes` | ❌ Requiere devDependencies |
| Datos base (idiomas y plantillas) | `npm run seed` | ❌ Requiere `ts-node` |

Recomendación:

- **Cada despliegue**: ejecuta `npm run migration:run:prod` como paso previo (*pre-deploy* / *release command*), antes de que el tráfico llegue a la versión nueva.
- **Primer despliegue y cuando cambie el esquema de Better Auth**: ejecuta `auth:migrate` y `seed` desde tu máquina o desde un job de CI (con `npm ci` completo) apuntando a la base de producción, exportando `DATABASE_URL` y las variables `DB_*`. Ambos son idempotentes.

```bash
# Desde un checkout del repo, con las variables de PRODUCCIÓN exportadas
npm ci
npm run auth:migrate -- --yes
npm run migration:run
npm run seed
```

## 4. Railway

1. **New Project → Deploy from GitHub repo**. Railway detecta el `Dockerfile` y lo usa.
2. Añade el plugin **PostgreSQL** y copia sus credenciales a las variables `DB_*` y `DATABASE_URL` (puedes referenciarlas con `${{Postgres.PGHOST}}`, etc.).
3. En **Settings → Deploy**:
   - *Pre-deploy command*: `npm run migration:run:prod`
   - *Healthcheck path*: `/api/v1/health`
4. Define `TRUST_PROXY=1`, `BETTER_AUTH_URL` con tu dominio público y el resto de variables de la tabla anterior.
5. Ejecuta una vez `auth:migrate` y `seed` contra la base (paso 3).

## 5. Fly.io

```bash
fly launch --no-deploy        # detecta el Dockerfile y crea fly.toml
fly postgres create           # o usa una base gestionada externa
fly secrets set BETTER_AUTH_SECRET=... MAGIC_LINK_SECRET=... API_KEY=... DATABASE_URL=... # etc.
```

En `fly.toml`:

```toml
[env]
  NODE_ENV = "production"
  TRUST_PROXY = "1"
  PORT = "3000"

[deploy]
  release_command = "npm run migration:run:prod"

[http_service]
  internal_port = 3000
  force_https = true

  [[http_service.checks]]
    method = "GET"
    path = "/api/v1/health"
    interval = "30s"
    timeout = "5s"
    grace_period = "30s"
```

Después `fly deploy`. Ejecuta `auth:migrate` y `seed` una vez (paso 3, p. ej. con `fly proxy 5432` para alcanzar la base desde tu máquina).

## 6. VPS con Docker Compose

El `docker-compose.yml` del repo ya define el servicio `app` (perfil opcional) y Postgres. En un VPS:

```bash
git clone <tu-repo> && cd <tu-repo>
cp .env.example .env          # completa con valores de producción
docker compose --profile app up -d --build
```

Antes de dirigir tráfico, aplica las migraciones (paso 3). Pon un proxy inverso con TLS delante, por ejemplo [Caddy](https://caddyserver.com/):

```caddyfile
api.example.com {
    reverse_proxy localhost:3000
}
```

Con el proxy delante, define `TRUST_PROXY=1` y `BETTER_AUTH_URL=https://api.example.com`.

> En producción usa una base de datos con copias de seguridad (gestionada o con `pg_dump` programado); el volumen `postgres_data` de compose no es un backup.

## 7. Lista de verificación

- [ ] Secretos generados (no los de ejemplo) y guardados en el gestor de secretos del proveedor.
- [ ] `BETTER_AUTH_URL` con `https` y `FRONTEND_URL` con el origen real del frontend.
- [ ] `DB_SSL=true` si la base es remota.
- [ ] `TRUST_PROXY` configurado según los saltos de proxy.
- [ ] Migraciones aplicadas, `auth:migrate` y `seed` ejecutados al menos una vez.
- [ ] `GET /api/v1/health` responde `200`.
- [ ] Documentación `/api/v1/docs` revisada: OpenAPI JSON/YAML solo se exponen en `development` y `staging`.
