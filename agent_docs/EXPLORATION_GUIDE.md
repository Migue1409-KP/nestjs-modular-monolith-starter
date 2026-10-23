# EXPLORATION_GUIDE.md

## Overview

How an AI agent should explore the codebase before making changes to the NestJS backend.

## Core Concepts

- Start from NestJS entry points (`main.ts`, `app.module.ts`).
- Identify feature modules under `src/<feature>/`.
- Use the `users` module as a reference implementation.

## Exploration Workflow

1. **Entry points**
   - Read `src/main.ts` to see global guards (`ApiKeyGuard`), pipes, interceptors, filters, CORS and OpenAPI/Scalar setup.
   - Read `src/app.module.ts` to understand imported modules and the global `PolicyGuard`.

2. **Cross-cutting layers**
   - `src/core`: configuration, DB connection, migrations and seeders, notifications (SES), parameters, storage (R2), health.
   - `src/shared`: guards, authorization (`PolicyService`), interceptors, pipes, filters, decorators, interfaces, utils.
   - `config/authorization.yaml`: RBAC matrix; check it first when a route returns 403.

3. **Feature modules**
   - Find folders like `src/users`, `src/auth`, `src/notifications`, etc.
   - Inside each feature:
     - `entities/*` – database models.
     - `repositories/*` – data access patterns.
     - `services/*` – business logic.
     - `controllers/*` – HTTP endpoints.
     - `dto/*` – validation and types.
     - `*.module.ts` – wiring; `*.spec.ts` – unit tests next to the code.

4. **Canonical example**
   - Use `src/users` as the canonical NestJS module pattern.
   - See `USERS_MODULE_GUIDE.md` for a detailed walkthrough.

## Patterns & Best Practices

- Prefer reading existing modules that solve similar problems before proposing new structures.
- Keep a mental map: controller → service → repository → entity.
- Respect existing error handling (ProblemDetails) and logging patterns.

## Important Notes

- Do not scan the entire repo blindly; open only the directories relevant to the current task.
- If no similar module exists, default to copying the structure from `src/users`.