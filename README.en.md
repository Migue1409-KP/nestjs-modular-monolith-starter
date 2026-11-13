# NestJS Modular Monolith Starter

[Español](./README.md) · **English**

[![CI](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](./LICENSE)
[![Release](https://img.shields.io/github/v/release/Migue1409-KP/nestjs-modular-monolith-starter?sort=semver)](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/releases)
[![Node](https://img.shields.io/badge/node-%E2%89%A5%2022.12-339933.svg)](https://nodejs.org)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E.svg)](https://nestjs.com)

A base template for **NestJS** projects, designed to scale as a **modular monolith**. It provides a production-ready foundation with modern authentication, role-based authorization, a relational database, validation, request tracing, email notifications and interactive API documentation.

> The project's in-depth guides are mostly in Spanish. The [documentation index](./doc/en/README.md) lists what is available in English (deployment, using the template).

## Features

- 🔐 **Authentication with Better Auth**: cookie sessions, magic link and Google OAuth.
- 🛡️ **Role-based authorization (RBAC)** defined in YAML, with `USER` and `ADMIN` roles and resource ownership checks.
- 🗄️ **PostgreSQL + TypeORM** with migrations and idempotent seeders.
- ✅ **Zod validation** and standard **RFC 9457 (Problem Details)** errors.
- 📚 **Interactive docs with Scalar** covering both your endpoints and Better Auth's.
- 📬 **Email notifications** (AWS SES) with multi-language templates.
- ☁️ **File uploads** to Cloudflare R2 through presigned URLs.
- 🔎 Structured logging with `requestId`, health check and per-request tracing.
- 🧪 Jest tests, Husky + commitlint + lint-staged, Docker and SonarQube support.

## Tech stack

| Tool | Role |
|---|---|
| **NestJS 11 + Express + TypeScript** | Main framework, feature-first structure |
| **PostgreSQL + TypeORM** | Relational database with migrations |
| **Better Auth** (+ `@thallesp/nestjs-better-auth`) | Authentication and sessions |
| **Zod** | DTO validation through custom pipes |
| **Winston** | Structured logging |
| **OpenAPI + Scalar** | Interactive docs at `/api/v1/docs` |
| **AWS SES** | Email delivery from the notifications module |
| **Cloudflare R2** | File storage with presigned URLs |
| **Docker** | Local database and optional app image |

## Requirements

- **Node.js ≥ 22.12** (the Better Auth 1.7 `auth` CLI requires it). With nvm: `nvm use`.
- **PostgreSQL 15+** (local or Docker).
- npm.

## Quick start

```bash
# 1. Dependencies
npm ci

# 2. Environment variables
cp .env.example .env        # and fill in the values (see the table below)

# 3. Database
docker compose up -d postgres

# 4. Schema and base data
npm run auth:migrate        # Better Auth tables (users, sessions, accounts, verifications)
npm run migration:run       # TypeORM migrations
npm run seed                # languages and notification templates

# 5. Run
npm run start:dev
```

The API is available at `http://localhost:3000/api/v1` and the docs at `http://localhost:3000/api/v1/docs`.

> If you change the Better Auth schema (plugins, fields), run `npm run auth:generate` and `npm run auth:migrate` again. For TypeORM entity changes: `npm run migration:generate -- src/core/database/migrations/ChangeName` and `npm run migration:run`.

## Environment variables

Fill them in `.env` (template in [`.env.example`](./.env.example)). The app validates them at startup and refuses to boot if required ones are missing.

| Variable | Description |
|---|---|
| `PORT`, `HOST`, `API_PREFIX` | Port, host and global prefix (default `api/v1`) |
| `NODE_ENV` | `development`, `staging` or `production` |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | TypeORM connection |
| `DB_SSL` | `true` if your database provider requires SSL |
| `DATABASE_URL` | Connection string used by Better Auth |
| `BETTER_AUTH_SECRET` | Long random secret (min. 32 chars, required) |
| `BETTER_AUTH_URL` | *Optional.* Public origin without path (default `HOST:PORT`); needed behind a TLS proxy |
| `MAGIC_LINK_TOKEN_LENGTH`, `MAGIC_LINK_SECRET` | Magic link token generation |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google login |
| `GOOGLE_SCOPES` | *Optional.* Extra Google scopes, comma separated; by default only `openid`, `email` and `profile` |
| `API_KEY` | Key required in the `api-key` header by the global guard (min. 16 chars) |
| `FRONTEND_URL` | Frontend origin(s), comma separated (CORS and trusted origins) |
| `COOKIE_CROSS_SITE`, `DOMAIN` | `true` if the frontend lives on another site; `DOMAIN` enables cross-subdomain cookies |
| `TRUST_PROXY`, `BODY_LIMIT`, `THROTTLE_*` | Optional HTTP hardening: proxy hops, body size and rate limits |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SES_SENDER` | Email delivery with SES |
| `R2_*` | Cloudflare R2 (account, keys, bucket and public URL) |
| `LOG_LEVEL` | Winston level |

## Authentication and authorization

- **Authentication**: Better Auth mounts its endpoints at `/api/v1/auth/*` (magic link, Google, sessions, email change…). The session travels in the `better-auth.session_token` cookie.
- **Roles**: stored in `user_profiles.roles` (default `USER`) and injected into the session with `customSession`.
- **Authorization**: `PolicyGuard` evaluates the [`config/authorization.yaml`](./config/authorization.yaml) matrix per resource and HTTP method. Routes marked `@AllowAnonymous()` or `@OptionalAuth()` skip the check.
- **Resource ownership**: a `USER` can only access their own profile (`/users/profile/:id`); `ADMIN` can access everything.
- **API key**: routes not marked `@Public()` require the `api-key` header.

More detail in [`doc/03-authentication.md`](./doc/03-authentication.md) (Spanish).

## API documentation

With the application running:

| Resource | URL |
|---|---|
| Interactive reference (Scalar): your endpoints **and** Better Auth's | `http://localhost:3000/api/v1/docs` |
| OpenAPI JSON / YAML (`development` and `staging` only) | `/api/v1/download/openapi.json` · `/api/v1/download/openapi.yaml` |

In Scalar you can try requests directly (*Test Request*). For protected routes, sign in first and send the `api-key` header. The OpenAPI `version` follows the one in `package.json`.

## Useful scripts

| Script | Description |
|---|---|
| `npm run start:dev` | Watch-mode server |
| `npm run build` / `npm run start:prod` | Compile and run `dist/` |
| `npm run lint` · `npm run lint:fix` · `npm run typecheck` · `npm run format` | ESLint (no `--fix`, fails on warnings), ESLint with autofix, `tsc --noEmit` and Prettier |
| `npm test` · `test:watch` · `test:cov` · `test:e2e` | Unit tests, coverage and e2e |
| `npm run auth:generate` · `auth:migrate` | Better Auth schema |
| `npm run migration:generate` · `migration:run` · `migration:revert` | TypeORM migrations |
| `npm run seed` | Languages and notification templates |

## Project structure

```text
src/
 app.module.ts        # Root module
 main.ts              # Bootstrap, OpenAPI/Scalar, guards, pipes and global interceptors
 auth/                # Better Auth integration and custom endpoints
 core/                # Infrastructure: DB, logger, HTTP, notifications, parameters, storage, health
 notifications/       # Notification administration (ADMIN role)
 shared/              # Decorators, filters, guards, interceptors, pipes, authorization
 users/               # Example domain: profiles, repository, service, controller
config/                # Authorization matrix (YAML)
doc/                   # Detailed documentation (Spanish, with English guides in doc/en)
agent_docs/            # Guides for AI agents
```

An architecture diagram and the request lifecycle are in [`doc/02-architecture-and-structure.md`](./doc/02-architecture-and-structure.md#diagramas).

## Documentation

See the [documentation index](./doc/en/README.md). Highlights:

- [Using this template](./doc/en/08-using-the-template.md): rename, clean up and remove example modules.
- [Deployment](./doc/en/07-deployment.md): Docker, Railway, Fly.io and VPS.

## Versioning

We follow [SemVer](https://semver.org/). Releases are automated with [release-please](https://github.com/googleapis/release-please) from Conventional Commits. History is in the [CHANGELOG](./CHANGELOG.md) (Spanish) and published versions in [Releases](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/releases).

## Contributing

Read the [contribution guide](./CONTRIBUTING.md) and the [Code of Conduct](./CODE_OF_CONDUCT.md) (both in Spanish). To report vulnerabilities follow the [Security policy](./SECURITY.md).

## License

Distributed under the [Apache 2.0](./LICENSE) license.
