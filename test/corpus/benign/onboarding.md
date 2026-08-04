# Onboarding

Steps to get a new developer up and running on this project.

## Prerequisites

Install the following before cloning:
- Node.js 20 or later (use `nvm` or `fnm` to manage versions)
- pnpm: `npm install -g pnpm`
- Docker Desktop (for local database and services)
- Git

## Clone the Repository

```bash
git clone https://github.com/your-org/your-repo.git
cd your-repo
```

## Install Dependencies

```bash
pnpm install
```

## Configure Environment Variables

Copy the example configuration file and fill in your local values:

```bash
cp env.example env.local
```

Open `env.local` in your editor and configure each variable. The file contains comments explaining what each variable controls. Ask a teammate for values specific to your local setup (database connection strings, third-party service endpoints, etc.).

Do not commit `env.local` — it is listed in the project's gitignore file.

## Start Local Services

```bash
docker compose up -d
```

This starts the local database and any dependent services defined in `compose.yml`.

## Run Database Migrations

```bash
pnpm db:migrate
```

## Start the Dev Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

## Run the Test Suite

```bash
pnpm test
```

All tests should pass on a fresh clone. If they do not, verify that your environment variables are configured correctly and that Docker services are running.

## Project Structure

- `src/` — application source code
- `migrations/` — database migration files
- `tests/` — unit and integration tests
- `docs/` — project documentation

## Getting Help

Check the `docs/` directory first. For questions not covered there, ask in the team's chat channel.
