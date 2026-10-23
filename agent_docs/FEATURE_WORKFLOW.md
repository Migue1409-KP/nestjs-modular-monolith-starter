# FEATURE_WORKFLOW.md

## Overview

Standard workflow for adding a new feature or domain module to the NestJS backend.

## Core Concepts

- Each feature lives in its own folder under `src/<feature>/`.
- A complete feature includes: entity, repository, service, controller, DTOs and tests.
- The `users` module is the canonical example.

## Standard Workflow

1. **Entity**
   - Create a TypeORM `@Entity` in `src/<feature>/entities/`.
   - Use `uuid` primary keys and explicit column names.
   - Add relations using `@ManyToOne`, `@OneToMany`, etc., when needed.
   - Include `@CreateDateColumn` and `@UpdateDateColumn` for timestamps.

2. **Repository**
   - Create a class extending `Repository<Entity>` in `src/<feature>/repositories/`.
   - Inject `DataSource` and implement a `getRepository(queryRunner?)` helper.
   - Provide high-level methods:
     - Read: `findAll`, `findOneById`, `findBy<key>`.
     - Write: `createEntity`, `updateEntity`, `deleteEntity` / `softDelete`.
   - Accept an optional `QueryRunner` argument for methods that can participate in transactions.

3. **Service**
   - Create an `@Injectable()` service in `src/<feature>/services/`.
   - Inject the repository (and other dependencies).
   - Keep all business logic here (validations, cross-entity operations, transactions).
   - Use `@Transactional()` or explicit `QueryRunner` for multi-table writes.
   - Throw Nest HTTP exceptions (e.g. `NotFoundException`) with structured error payloads.

4. **Controller**
   - Create a controller under `src/<feature>/controllers/`.
   - Authentication and authorization are global (`PolicyGuard`): do **not** add `@UseGuards`. Use `@Session()` to read the session; use `@AllowAnonymous()` / `@OptionalAuth()` / `@Public()` (from `@/shared/decorators`) only for deliberate exceptions.
   - Add the new routes to `config/authorization.yaml` (resource = route pattern without the global prefix, e.g. `products/:id`); otherwise `USER` gets 403.
   - If a route exposes a resource by `:id`, enforce ownership in the controller (see `assertOwnerOrAdmin` in `users.controller.ts`).
   - Use `ZodValidationPipe` with Zod schemas for bodies (`@Body(new ZodValidationPipe(Schema))`).
   - Document endpoints with `@nestjs/swagger` decorators and realistic examples.
   - Return `ApiSuccess<T>` (`{ status: 'success', data }`); `ResponseInterceptor` adds `requestId` and wraps plain returns.

5. **DTOs & Validation**
   - Define Zod schemas in `src/<feature>/dto/`.
   - Export DTO types as `z.infer<typeof Schema>`.
   - Provide Swagger DTO classes annotated with `@ApiProperty`.

6. **Module, migration & seed**
   - Register entity (`TypeOrmModule.forFeature`), repository, service and controller in `src/<feature>/<feature>.module.ts` and import it in `AppModule`.
   - Generate a migration for schema changes (`npm run migration:generate --name=...`, then `npm run migration:run`).
   - Add idempotent seeders in `src/core/database/seeders/` when base data is needed.

7. **Tests**
   - Create Jest unit tests as `*.spec.ts` next to the code (e.g. `src/<feature>/services/<feature>.service.spec.ts`).
   - Mock repositories and other dependencies.
   - Cover success and error paths (e.g. entity not found, invalid state).

## Patterns & Best Practices

- Start from the `users` module when in doubt.
- Keep each step small and verifiable.
- Always update or add tests when changing business logic.

## Important Notes

- Do not introduce new layers or patterns (e.g. CQRS, event sourcing) unless explicitly required.
- Coordinate DB changes with TypeORM migrations and BetterAuth migrations (`npm run auth:migrate`) when needed.
- The `create-feature` skill (`.claude/skills/create-feature`) can scaffold a module from a DBML spec.