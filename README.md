# nextjs-postgres-auth-template

A production-ready Next.js starter with PostgreSQL, cookie-based sessions, role-based access control (RBAC), and email activation — ready to deploy on Vercel.

## Features

- **Next.js 14** (Pages Router + API Routes)
- **PostgreSQL 16** with raw parameterized SQL via `pg` (no ORM)
- **Schema migrations** with `node-pg-migrate`
- **Cookie sessions** — `httpOnly`, 30-day expiry, stored in the database
- **RBAC** — feature-based permissions with `authorization.can()` and `authorization.filterOutput()`
- **Email activation flow** — token-based account activation via Nodemailer
- **Typed error hierarchy** — `ValidationError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, and more
- **Docker Compose** — PostgreSQL + Mailcatcher for local development
- **Full test suite** — integration tests with Jest and an orchestrator helper
- **Code quality** — ESLint, Prettier, Husky, Commitlint, Commitizen, Secretlint

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose

### Setup

1. **Clone or use this template**

```bash
git clone https://github.com/your-username/nextjs-postgres-auth-template.git
cd nextjs-postgres-auth-template
npm install
```

2. **Configure environment variables**

```bash
cp .env.example .env.development
```

Fill in the values in `.env.development`. At minimum you need the Postgres credentials and `APP_NAME` / `APP_EMAIL`.

3. **Start services and run migrations**

```bash
npm run services:up
npm run migrations:up
```

4. **Start the development server**

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable              | Description                             | Default     |
| --------------------- | --------------------------------------- | ----------- |
| `POSTGRES_HOST`       | PostgreSQL host                         | `localhost` |
| `POSTGRES_PORT`       | PostgreSQL port                         | `5432`      |
| `POSTGRES_USER`       | PostgreSQL user                         | —           |
| `POSTGRES_DB`         | PostgreSQL database name                | —           |
| `POSTGRES_PASSWORD`   | PostgreSQL password                     | —           |
| `DATABASE_URL`        | Full connection string (auto-generated) | —           |
| `POSTGRES_CA`         | CA certificate for SSL (production)     | —           |
| `EMAIL_SMTP_HOST`     | SMTP host                               | `localhost` |
| `EMAIL_SMTP_PORT`     | SMTP port                               | `1025`      |
| `EMAIL_SMTP_USER`     | SMTP user                               | —           |
| `EMAIL_SMTP_PASSWORD` | SMTP password                           | —           |
| `EMAIL_HTTP_HOST`     | Email web UI host (Mailcatcher)         | `localhost` |
| `EMAIL_HTTP_PORT`     | Email web UI port                       | `1080`      |
| `APP_NAME`            | Application name (used in emails)       | —           |
| `APP_EMAIL`           | Sender email address                    | —           |
| `ACTIVATION_PATH`     | Path for activation links               | `/activate` |
| `PRODUCTION_URL`      | Full production URL                     | —           |

## Available Scripts

| Command                       | Description                                            |
| ----------------------------- | ------------------------------------------------------ |
| `npm run dev`                 | Start dev server (with Docker services and migrations) |
| `npm test`                    | Run the full integration test suite                    |
| `npm run test:watch`          | Run tests in watch mode                                |
| `npm run migrations:create`   | Create a new migration file                            |
| `npm run migrations:up`       | Apply pending migrations                               |
| `npm run migrations:status`   | Show migration status                                  |
| `npm run services:up`         | Start Docker services                                  |
| `npm run services:down`       | Stop and remove Docker services                        |
| `npm run lint:prettier:check` | Check formatting                                       |
| `npm run lint:prettier:fix`   | Fix formatting                                         |
| `npm run commit`              | Commit with Commitizen                                 |

## Project Structure

```
├── infra/
│   ├── compose.yaml        # Docker services (PostgreSQL + Mailcatcher)
│   ├── controller.js       # Middleware (auth injection, RBAC, error handling)
│   ├── database.js         # PostgreSQL client helper
│   ├── email.js            # Nodemailer transport
│   ├── errors.js           # Typed error hierarchy
│   ├── webserver.js        # Origin URL helper
│   ├── migrations/         # node-pg-migrate migration files
│   └── scripts/
│       └── wait-for-postgres.js
├── models/
│   ├── activation.js       # Email activation token logic
│   ├── authentication.js   # Credential verification
│   ├── authorization.js    # RBAC engine
│   ├── migrator.js         # Migration runner
│   ├── password.js         # bcrypt helpers
│   ├── session.js          # Session CRUD
│   └── user.js             # User CRUD
├── pages/
│   ├── index.js
│   └── api/v1/             # REST API routes
└── tests/
    ├── orchestrator.js     # Test utilities (DB reset, factories)
    └── integration/        # Integration tests
```

## Deploying to Vercel

1. Push to GitHub and import the repository in Vercel.
2. Set all environment variables listed above in the Vercel project settings.
3. Vercel will inject `VERCEL_ENV` and `VERCEL_URL` automatically for preview deployments.

## License

MIT
