# Deployment

Versión en español: [`../07-deployment.md`](../07-deployment.md).

This guide covers taking the API to production with the repository's Docker image. The steps are the same on every provider: **build the image → set variables → migrate the database → start**.

## 1. What the image contains

The [`Dockerfile`](../../Dockerfile) is multi-stage: it compiles in one stage and the final image only holds `dist/`, production dependencies and `config/authorization.yaml`. It runs as the unprivileged `node` user, exposes port `3000` and defines a `HEALTHCHECK` on `GET /<API_PREFIX>/health` (default `/api/v1/health`).

> The image does **not** ship dev dependencies. Inside the container you can only run `npm run migration:run:prod`; `auth:migrate` and `seed` need `ts-node` and the `auth` CLI (see [step 3](#3-migrations-and-seed-data)).

## 2. Production environment variables

The app **will not start** if the required ones are missing (validated with Zod). With `NODE_ENV=production`, `GOOGLE_*`, `AWS_*` and `R2_*` are also required. Full reference in the [README](../../README.en.md#environment-variables).

| Variable | Recommended value |
|---|---|
| `NODE_ENV` | `production` |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `DATABASE_URL` | Your managed database credentials |
| `DB_SSL` | `true` if the provider requires TLS (the certificate is verified; use `DB_SSL_CA` for a private CA) |
| `BETTER_AUTH_SECRET`, `MAGIC_LINK_SECRET` | `openssl rand -base64 32` (min. 32 chars) |
| `API_KEY` | `openssl rand -base64 24` (min. 16 chars) |
| `BETTER_AUTH_URL` | Public origin **with https** and no path, e.g. `https://api.example.com` |
| `FRONTEND_URL` | Frontend origin(s) for CORS, comma separated |
| `TRUST_PROXY` | `1` when behind a proxy (Railway, Fly.io, Caddy/Nginx) so rate limiting sees the real client IP |
| `COOKIE_CROSS_SITE`, `DOMAIN` | Depending on where the frontend lives (see README) |

## 3. Migrations and seed data

Three database operations, each with different tooling requirements:

| Step | Command | Inside the production image? |
|---|---|---|
| TypeORM migrations | `npm run migration:run:prod` | ✅ Yes (uses `dist/`) |
| Better Auth schema | `npm run auth:migrate -- --yes` | ❌ Needs devDependencies |
| Seed data (languages and templates) | `npm run seed` | ❌ Needs `ts-node` |

Recommendation:

- **Every deploy**: run `npm run migration:run:prod` as a *pre-deploy* / *release command*, before traffic reaches the new version.
- **First deploy and whenever the Better Auth schema changes**: run `auth:migrate` and `seed` from your machine or a CI job (full `npm ci`) pointing at the production database, with `DATABASE_URL` and the `DB_*` variables exported. Both are idempotent.

```bash
# From a repo checkout, with PRODUCTION variables exported
npm ci
npm run auth:migrate -- --yes
npm run migration:run
npm run seed
```

## 4. Railway

1. **New Project → Deploy from GitHub repo**. Railway detects and uses the `Dockerfile`.
2. Add the **PostgreSQL** plugin and copy its credentials into `DB_*` and `DATABASE_URL` (you can reference them with `${{Postgres.PGHOST}}`, etc.).
3. In **Settings → Deploy**:
   - *Pre-deploy command*: `npm run migration:run:prod`
   - *Healthcheck path*: `/api/v1/health`
4. Set `TRUST_PROXY=1`, `BETTER_AUTH_URL` to your public domain and the rest of the variables above.
5. Run `auth:migrate` and `seed` once against the database (step 3).

## 5. Fly.io

```bash
fly launch --no-deploy        # detects the Dockerfile and creates fly.toml
fly postgres create           # or use an external managed database
fly secrets set BETTER_AUTH_SECRET=... MAGIC_LINK_SECRET=... API_KEY=... DATABASE_URL=... # etc.
```

In `fly.toml`:

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

Then `fly deploy`. Run `auth:migrate` and `seed` once (step 3, e.g. with `fly proxy 5432` to reach the database from your machine).

## 6. VPS with Docker Compose

The repo's `docker-compose.yml` already defines the `app` service (opt-in profile) and Postgres. On a VPS:

```bash
git clone <your-repo> && cd <your-repo>
cp .env.example .env          # fill in production values
docker compose --profile app up -d --build
```

Apply the migrations (step 3) before sending traffic. Put a TLS reverse proxy in front, for example [Caddy](https://caddyserver.com/):

```caddyfile
api.example.com {
    reverse_proxy localhost:3000
}
```

Behind the proxy, set `TRUST_PROXY=1` and `BETTER_AUTH_URL=https://api.example.com`.

> In production use a database with backups (managed, or a scheduled `pg_dump`); the compose `postgres_data` volume is not a backup.

## 7. Checklist

- [ ] Secrets generated (not the example ones) and stored in the provider's secret manager.
- [ ] `BETTER_AUTH_URL` uses `https` and `FRONTEND_URL` is the real frontend origin.
- [ ] `DB_SSL=true` if the database is remote.
- [ ] `TRUST_PROXY` matches your proxy hops.
- [ ] Migrations applied; `auth:migrate` and `seed` run at least once.
- [ ] `GET /api/v1/health` returns `200`.
- [ ] `/api/v1/docs` reviewed: OpenAPI JSON/YAML are only exposed in `development` and `staging`.
