# Using this template

Versión en español: [`../08-using-the-template.md`](../08-using-the-template.md).

A guide to turning the starter into **your** project: create it, rename it, clean up what you don't need and remove the example modules.

## 1. Create your repository

**Option A: "Use this template" (recommended).** On the repository page click **Use this template → Create a new repository**. You get a clean history, without the starter's commits or tags.

> For maintainers: the button appears once you enable **Settings → General → Template repository** on the starter repo. It is a GitHub setting and cannot be versioned in code.

**Option B: `degit`.**

```bash
npx degit Migue1409-KP/nestjs-modular-monolith-starter my-project
cd my-project && git init
```

Then follow the [quick start](../../README.en.md#quick-start) to bring the environment up.

## 2. Rename the project

Find the current name with `git grep -n -i "nestjs.modular\|nestjs_template\|nestjs-template\|Migue1409"` and replace it in:

| File | What to change |
|---|---|
| `package.json` | `name`, `description`, `author`, `repository`, `bugs`, `homepage`, `version` (start at `0.1.0` or `1.0.0`) |
| `.release-please-manifest.json` | The initial version (must match `package.json`) |
| `release-please-config.json` | `package-name` |
| `docker-compose.yml` | `container_name` of `postgres` and `app`, and the `nestjs_template` database defaults |
| `src/core/database/data-source.ts` and `src/core/config/database.config.ts` | Default database name |
| `src/main.ts` | OpenAPI `setTitle` / `setDescription` |
| `sonar-project.properties` | `sonar.projectKey`, `sonar.projectName` (or delete it and `docker-compose.sonarqube.yml` if you don't use SonarQube) |
| `README.md`, `README.en.md` | Title, badges (repo URLs), description |
| `LICENSE` | Copyright holder (Apache 2.0 requires keeping the license and attribution notices; change the holder where appropriate) |
| `SECURITY.md`, `CODE_OF_CONDUCT.md`, `.github/ISSUE_TEMPLATE/*` | Repo URLs and contact emails |

## 3. Clean up what belongs to the starter

- [ ] Replace `CHANGELOG.md` with an empty header (the starter's history is not yours). release-please will fill it.
- [ ] Delete `ROADMAP.md` or replace it with your own.
- [ ] Decide what to do with `agent_docs/`, `AGENTS.md` and `CLAUDE.md`: they are guides for AI agents, useful if you use them; delete them if not.
- [ ] Delete `doc/en/` or the Spanish `doc/` files if you don't want to maintain both languages.
- [ ] Generate your own secrets (`openssl rand -base64 32`); never reuse example values.
- [ ] Review `config/authorization.yaml`: it defines what each role can do on each resource.
- [ ] On GitHub: enable Dependabot, protect `main` and require the `Lint, typecheck, test, build` job to pass.

## 4. Which modules you can remove

| Module | Removable? | How |
|---|---|---|
| `src/notifications/` (template administration, ADMIN role) | ✅ Yes, it is self-contained | Remove `NotificationsModule` from `AppModule` and delete it. Remove its rules from `config/authorization.yaml`. Email sending (`core/notification`) is **not** touched: authentication uses it. |
| `src/users/` (profiles) | ⚠️ Not directly | `AuthModule` and the Better Auth factory depend on `UsersService` (creating the profile on sign-up and putting roles in the session). It is the canonical module: **extend it**, or replace it carefully keeping that contract. |
| `core/storage` (Cloudflare R2) | ✅ Yes | Remove `StorageModule` from the `imports` and `exports` of `CoreModule`, delete the module and the `R2_*` variables from `src/core/config/env.validation.ts` and `.env.example`. |
| `core/notification` + SES | ⚠️ Only if you change provider | A `MailProvider` interface exists: implement another provider instead of deleting it (magic-link auth needs to send email). |
| Google OAuth | ✅ Yes | Remove `socialProviders.google` in `src/auth/providers/auth-config.factory.ts` and the `GOOGLE_*` variables from the env schema. |

After removing a module always run:

```bash
npm run lint && npm run typecheck && npm test
```

The removed module's tests will fail or be orphaned; delete them with the module and adjust the coverage thresholds in `package.json` if needed.

## 5. Add your first feature

Follow [Adding new features](../05-adding-new-features.md) (Spanish): use `src/users/` as a reference and add your rules to `config/authorization.yaml`.

## 6. Publishing versions

The repo includes [release-please](https://github.com/googleapis/release-please): when Conventional Commits are merged into `main` it opens (and maintains) a release PR that bumps the version and updates `CHANGELOG.md`; merging it creates the `vX.Y.Z` tag and the GitHub release. For it to open PRs, enable **Settings → Actions → General → Workflow permissions → Allow GitHub Actions to create and approve pull requests**.
