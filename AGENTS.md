# AGENTS.md

You are an AI coding agent working on a NestJS modular monolith backend.
Optimize for **correctness**, **consistency with existing patterns**, and **small, well-tested changes**.

## Project Overview

- This repository is a NestJS modular monolith template for SaaS / enterprise backends.
- Tech stack: NestJS 11 (TypeScript), Express, TypeORM (PostgreSQL), BetterAuth, Zod, Winston, AWS SES, Cloudflare R2, OpenAPI + Scalar. Node.js >= 22.12.
- Always follow existing patterns from the `users` module and `agent_docs/*` before inventing new architectures.

For deeper context, you MAY open docs under `agent_docs/` (start with `agent_docs/README.md`).

## Architecture & Conventions

- Feature-first / modular monolith:
  - `src/core`: infrastructure and cross-cutting concerns (DB, notifications/SES, parameters, storage/R2, health, HTTP client).
  - `src/shared`: guards (`PolicyGuard`, `ApiKeyGuard`), authorization (RBAC), interceptors, pipes (Zod), filters (ProblemDetails RFC9457), decorators, interfaces, utils.
  - `src/auth`: BetterAuth configuration and `local-auth` controller.
  - `src/users`: canonical example module (entity, repository, service, controller, DTOs, tests).
  - `src/notifications`: admin endpoints for notifications.
  - `config/authorization.yaml`: RBAC matrix (role → resource → HTTP methods). Every new route must be added here.

- Language:
  - **English** for code comments, commit messages, internal docs for agents.
  - **Spanish** for user-facing docs (`/doc`, `README.md`).

## How to implement a new feature

When asked to implement a new feature:

1. Plan the module folder under `src/<feature>/`.
2. Define:
   - Entity (TypeORM) in `entities/`.
   - Repository extending `Repository<Entity>` with helper methods and optional `QueryRunner`.
   - Service with business logic and transactions.
   - Controller with Zod validation, Swagger docs, and standardized responses (no `@UseGuards`; auth is global).
   - DTOs based on Zod schemas (+ Swagger DTO classes).
   - Rows in `config/authorization.yaml` and ownership checks for `:id` resources.
   - TypeORM migration for schema changes.
   - Unit tests mirroring the `users` module tests.

See `agent_docs/FEATURE_WORKFLOW.md` and `agent_docs/USERS_MODULE_GUIDE.md` for details.

## Testing & Commands

Preferred commands:

- `npm run start:dev` – start dev server in watch mode.
- `npm run migration:generate -- src/core/database/migrations/<Name>` – generate a TypeORM migration from entity changes.
- `npm run migration:run` – apply TypeORM migrations.
- `npm run auth:migrate` – apply BetterAuth schema changes (`auth:generate` regenerates the schema).
- `npm run seed` – load languages and notification templates.
- `npm test` – run unit tests (`test:cov` for coverage, `test:e2e` for e2e; the real-app e2e needs a disposable Postgres with the schema applied via `DATABASE_URL`/`DB_*`, it never runs against `synchronize` and is skipped without `DATABASE_URL`).
- `npm run lint` – ESLint (read-only, zero warnings; use `npm run lint:fix` to autofix), `npm run typecheck`; `npm run build` – compile.

Agents SHOULD reason about which commands to run after changes.

## Guardrails

- **Always**
  - Follow patterns from `users` module and `agent_docs/*`.
  - Keep TypeScript strict mode and NestJS DI best practices.
  - Add or update tests when changing business logic.

- **Ask first**
  - Introducing new dependencies.
  - Changing authentication / security behavior.
  - Large refactors across modules.

- **Never**
  - Disable validations, auth, or error handling to “make it work”.
  - Replace strong typings with `any` without justification.
  - Hardcode secrets or credentials.