# TESTING_GUIDE.md

## Overview

Testing strategy and expectations for this NestJS backend.

## Core Concepts

- Testing framework: Jest + `@nestjs/testing` (`ts-jest`, `rootDir: src`, files matching `*.spec.ts`).
- Scope: unit tests for services, controllers, guards, pipes, filters and interceptors; one e2e smoke suite in `test/`.
- `@thallesp/nestjs-better-auth` is mapped to `test/mocks/nestjs-better-auth.ts` in Jest, so tests never load the real library.
- Mocks: repositories, external services, `DataSource` / `QueryRunner`.

## Test Types

- **Service tests**
  - Use `Test.createTestingModule` to provide the service and mock repositories.
  - Focus on business rules and error handling.
- **Repository tests (optional)**
  - Only for complex queries; otherwise rely on TypeORM behavior.

## Patterns & Best Practices

- For each service with substantial logic, create a corresponding `*.spec.ts`.
- Mock repository methods (`findOneById`, `createEntity`, etc.) and assert interactions.
- Cover:
  - Success scenarios.
  - NotFound / validation errors.
  - Transactional behavior when relevant.

## Commands

- `npm test` – run all unit tests.
- `npm run test:watch` – watch mode.
- `npm run test:cov` – coverage (global thresholds in `package.json`: statements 25, branches 20, functions 15, lines 24).
- `npm run test:e2e` – e2e suite (`test/jest-e2e.json`); uses a stub module, no real DB or auth.
- The `pre-commit` Husky hook runs `jest --passWithNoTests --bail`, so failing tests block commits.

## Important Notes

- Do not bypass tests in CI; new features SHOULD include or update tests.
- Keep tests fast and deterministic; avoid real network or DB access.