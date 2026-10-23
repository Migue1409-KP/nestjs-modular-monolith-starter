# NEST_BACKEND_OVERVIEW.md

## Overview

High-level architecture of the NestJS modular monolith backend used in this repository.

## Core Concepts

- **Framework**: NestJS + Express, written in TypeScript with strict mode enabled.
- **Persistence**: TypeORM with PostgreSQL. Migrations are applied explicitly (`npm run migration:run`); `synchronize` is on only when `NODE_ENV` is not `production`/`staging`.
- **Auth**: BetterAuth (magic link, Google OAuth) with cookie-based sessions.
- **Authorization**: multi-role RBAC defined in `config/authorization.yaml`, enforced by the global `PolicyGuard`.
- **Validation**: Zod schemas + custom `ZodValidationPipe`.
- **Logging**: Winston (console + `logs/*.log`); `RequestIdInterceptor` sets `request.requestId`, which `LoggingInterceptor` prints and `ResponseInterceptor` returns in the body.
- **Mailing**: AWS SES wrapper (`NotificationService`) with multi-language templates stored in DB.
- **Storage**: Cloudflare R2 presigned-URL upload flow (`StorageService`).
- **Docs**: OpenAPI rendered with Scalar at `/<API_PREFIX>/docs` (Better Auth endpoints merged in).

## Module Layout

- `src/core` – global `CoreModule`: database, HTTP client, notifications (SES), parameters (languages), asset storage, health check.
- `src/shared` – interceptors (`RequestId`, logging, response), Zod pipe, ProblemDetails filter, guards (`PolicyGuard`, `ApiKeyGuard`), authorization (`PolicyService`, roles), decorators, interfaces, utils.
- `src/auth` – BetterAuth configuration (`AuthConfigFactory`) and `GET /local-auth/me`. Better Auth itself serves `/<API_PREFIX>/auth/*`.
- `src/users` – user profile management, canonical example module.
- `src/notifications` – admin endpoints to list/send/resend/retry notifications.
- `config/authorization.yaml` – RBAC matrix (role → resource → HTTP methods).

## Asset Storage (`StorageModule`)

Located at `src/core/storage/`. Exported globally via `CoreModule` — inject `StorageService` anywhere without additional imports.

**Provider pattern (Strategy):** `IStorageProvider` interface + `STORAGE_PROVIDER` injection token. Default implementation is `CloudflareR2Provider` (S3-compatible). To switch provider, change `useClass` in `storage.module.ts` only — no other file needs to change.

**Upload flow (presigned URL — file never passes through the API):**
1. `POST /storage/presign` → returns `{ uploadUrl, key, publicUrl, expiresAt }`.
2. Frontend `PUT`s the file binary directly to `uploadUrl` with the correct `Content-Type`.
3. Store `publicUrl` in the entity field (e.g. `user.photoUrl`, `post.coverUrl`).
4. To delete: `DELETE /storage/file` with the `key` or `publicUrl`, **or** call `storageService.deleteFiles(urls)` from the feature service before deleting the entity.

**Adding asset types:** extend `AssetType` enum and `ASSET_TYPE_CONFIG` in `src/core/storage/constants/asset-types.constant.ts`.

**Access:** `/storage/*` endpoints are not in the `USER` section of `config/authorization.yaml`, so only `ADMIN` can call them until you add rows.

**Required env vars:** `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`, `R2_PRESIGN_EXPIRES_IN` (default 300 s).

## Request Pipeline

Global components are wired in `src/main.ts` / `src/app.module.ts`:

1. `ApiKeyGuard` (manual global guard) – requires the `api-key` header; bypass with `@Public()`.
2. `PolicyGuard` (`APP_GUARD`) – fetches the Better Auth session once (`req.session`), then checks the RBAC matrix. Bypass with `@AllowAnonymous()` / `@OptionalAuth()` (project wrappers in `src/shared/decorators/`; ESLint forbids importing them from the library).
3. Interceptors: `RequestIdInterceptor` → `LoggingInterceptor` → `ResponseInterceptor` (wraps results in `{ status: 'success', data, requestId }`).
4. `ZodValidationPipe` (global, pass-through; validates only when given a schema) and `ProblemDetailsFilter` (RFC 9457 errors).

The library's own global `AuthGuard` is disabled (`disableGlobalAuthGuard: true`) because `PolicyGuard` does authentication + authorization in one pass.

## Authorization (RBAC)

- Roles live in `user_profiles.roles` (`text[]`, default `{USER}`) and are injected in `session.user.roles` by Better Auth's `customSession`. Valid roles: `ROLES` in `src/shared/authorization/constants/roles.constant.ts` (`ADMIN`, `USER`).
- The matrix is `config/authorization.yaml`; `PolicyService` validates it with Zod at startup. A request is allowed if **any** of the user's roles grants `resource` + HTTP method (`*` wildcards supported). The resource key is the route pattern without the global prefix (e.g. `users/profile/:id`).
- **New protected endpoint → add a row to the YAML.** Routes not listed are denied for `USER`; `ADMIN` has `*`.
- The matrix only checks the route. Ownership of `:id` resources must be enforced in the controller (see `assertOwnerOrAdmin` in `users.controller.ts`).

## Configuration & Setup

- Environment variables define DB, mailer, auth and storage configuration (see `.env.example`). DB vars: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`; Better Auth uses `DATABASE_URL`.
- TypeORM entities are discovered by glob (`**/*.entity{.ts,.js}`) in `data-source.ts` and `database.config.ts`; each feature module still declares them via `TypeOrmModule.forFeature`.
- Better Auth tables (`users`, `sessions`, `accounts`, `verifications`) are created via `npm run auth:migrate`; business tables via `npm run migration:run`; base data via `npm run seed`.

## Patterns & Best Practices

- Use **feature-first** organization: group controllers, services, repositories and entities per domain.
- Keep controllers thin; push logic into services.
- Use DTOs derived from Zod schemas for type safety and validation.

## Important Notes

- Do not introduce alternative ORMs or validation libraries.
- Do not bypass BetterAuth or custom pipes; extend them if needed.