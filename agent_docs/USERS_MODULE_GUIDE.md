# USERS_MODULE_GUIDE.md

## Overview

The `users` module manages user profiles linked to BetterAuth users.
It is the **reference implementation** for how to design a feature module.

## Core Concepts

- Entity: `UserProfile` with enums, relations, timestamps.
- Repository: `UserRepository` extending `Repository<UserProfile>`.
- Service: `UsersService` with transactions and validation.
- Controller: `UsersController` with Zod validation, Swagger docs and resource-ownership checks.
- DTOs: Zod schemas + Swagger DTO classes.
- Tests: Jest tests for `UsersService` and `UsersController` using mocked dependencies.

## Module Layout

- `src/users/entities/user-profiles.entity.ts`
- `src/users/repositories/user-profiles.repository.ts`
- `src/users/services/users.service.ts`
- `src/users/controllers/users.controller.ts`
- `src/users/dto/create-user.dto.ts`
- `src/users/dto/update-user.dto.ts`
- `src/users/users.module.ts`
- `src/users/services/users.service.spec.ts`
- `src/users/controllers/users.controller.spec.ts`

Endpoints (`/users/profile`): `POST` create, `GET me`, `GET :id`, `PATCH :id`.

## Patterns & Best Practices

- **Entity**
  - Table `user_profiles`; `authUserId` is unique and links to the Better Auth `users.id`.
  - Use an enum for `gender_type`.
  - Use `@ManyToOne` to `Language` with `@JoinColumn({ name: 'language' })`.
  - `roles` is a Postgres `text[]` (default `{USER}`, multi-role); nullable fields for optional properties.
  - Timestamps are `timestamptz`.

- **Repository**
  - Class `UserRepository` (file `user-profiles.repository.ts`) with `findOneById`, `findOneByAuthUserId`, `createEntity`, `updateEntity`, `deleteEntity`, `softDeleteProfile`.
  - Raw SQL only when necessary: `updateUserNameByAuthUserId` and `getProviderLogin` touch the Better Auth tables (`users`, `accounts`).

- **Service**
  - Validate related entities (e.g. `languageId`) and throw `NotFoundException` with structured data.
  - Use `@Transactional()` for `createProfile` and `updateProfile` (needs `dataSource` injected; the `QueryRunner` is appended as the last argument).
  - Map unique violations (Postgres `23505`) to `ConflictException`.
  - Keep name synchronization logic with BetterAuth user table in the service.

- **Controller**
  - No `@UseGuards`: the global `PolicyGuard` authenticates and authorizes using `config/authorization.yaml`. Read the session with `@Session()`.
  - `authUserId` and `email` always come from the session, never from the body.
  - `assertOwnerOrAdmin` ensures a `USER` only reads/updates their own profile (uniform 403).
  - Use Zod schemas (`CreateUserProfileBodySchema`, `UpdatePartialUserProfileSchema`) via `ZodValidationPipe`.
  - Provide Swagger examples for success and error responses.

- **Tests**
  - Use Jest and `@nestjs/testing` to create a `TestingModule`.
  - Mock repositories and `DataSource` transactional behavior.
  - Test both successful flows and error cases (e.g. profile not found).

## Important Notes

- When implementing new modules, use the `users` module as a direct template.
- Keep naming and patterns consistent to make reasoning easier for agents and humans.