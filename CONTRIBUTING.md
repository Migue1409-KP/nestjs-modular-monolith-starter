# Guía de contribución

¡Gracias por tu interés en mejorar **NestJS Modular Monolith Starter**! Esta guía explica cómo proponer cambios de forma ordenada.

Al participar aceptas cumplir nuestro [Código de Conducta](./CODE_OF_CONDUCT.md). Para vulnerabilidades de seguridad sigue la [Política de seguridad](./SECURITY.md) (no abras issues públicos).

## Formas de contribuir

- Reportar bugs o proponer mejoras mediante [issues](https://github.com/Migue1409-KP/nestjs-modular-monolith-starter/issues).
- Mejorar la documentación (`README.md`, `doc/`).
- Enviar pull requests con correcciones o nuevas funcionalidades.

Antes de empezar un cambio grande, abre un issue para acordar el enfoque.

## Entorno de desarrollo

Requisitos: **Node.js ≥ 22.12**, npm y PostgreSQL (puedes usar Docker).

```bash
nvm use 22            # o instala Node >= 22.12
npm ci
cp .env.example .env  # y completa los valores
docker-compose up -d postgres
npm run auth:migrate  # tablas de Better Auth
npm run migration:run # migraciones TypeORM
npm run seed          # idiomas y plantillas de notificación
npm run start:dev
```

Más detalle en [`doc/01-getting-started.md`](./doc/01-getting-started.md) y [`doc/04-database-and-migrations.md`](./doc/04-database-and-migrations.md).

## Flujo de trabajo

1. Haz un fork y crea una rama desde `main`: `feat/mi-cambio`, `fix/mi-bug`, `docs/mi-doc`.
2. Realiza cambios **pequeños y enfocados**, con tests.
3. Verifica localmente:
   ```bash
   npm run lint
   npm test
   npm run test:e2e
   npm run build
   ```
4. Abre un pull request hacia `main` describiendo el *qué* y el *por qué*.

## Convenciones

- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/) (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`...). Husky ejecuta `commitlint`, Prettier y los tests en cada commit; si fallan, el commit se cancela. Ver [`doc/06-git-conventional-commits.md`](./doc/06-git-conventional-commits.md).
- **Idioma**: inglés para código, comentarios y mensajes de commit; español para la documentación de usuario (`README.md`, `doc/`).
- **Arquitectura**: sigue los patrones del módulo `src/users` y las guías de [`doc/05-adding-new-features.md`](./doc/05-adding-new-features.md) y `agent_docs/`. Validación con DTOs + Zod, errores en formato Problem Details (RFC 9457).
- **Autorización**: toda ruta nueva debe cubrirse en `config/authorization.yaml`; si expone recursos por `:id`, comprueba la propiedad del recurso (ver `users.controller.ts`).
- **Base de datos**: cambios en entidades requieren una migración TypeORM; los datos base se cargan con seeders idempotentes.
- **Tests**: añade o actualiza tests al cambiar lógica de negocio.

## Checklist del pull request

- [ ] El código compila (`npm run build`) y pasa lint y tests.
- [ ] Añadí/actualicé tests y documentación.
- [ ] Incluí migración y/o seeder si cambié el esquema.
- [ ] Actualicé `CHANGELOG.md` (sección *Sin publicar*) si el cambio es visible para usuarios.
- [ ] Los commits siguen Conventional Commits.

## Versionado

Usamos [SemVer](https://semver.org/lang/es/) derivado de los tipos de commit: `fix` → patch, `feat` → minor y `BREAKING CHANGE` (o `!`) → major. Las versiones se publican como tags `vX.Y.Z` con su release en GitHub.

## Licencia

Al contribuir aceptas que tu aporte se licencia bajo [Apache License 2.0](./LICENSE), la misma del proyecto.
