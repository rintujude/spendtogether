# SpendTogether

SpendTogether is a shared budget application for workspaces, members, monthly
budgets, payment sources, categories, expenses, and dashboard reporting.

## Stack

- Backend: Java 17, Spring Boot, Spring Security, JWT, JPA/Hibernate
- Database: PostgreSQL with Flyway migrations
- Web frontend: React.js, online-first for MVP
- Android app later: React Native with offline-first local storage
- Deployment target: Linux VM

## Architecture Summary

- Cloud PostgreSQL is the shared source of truth after sync.
- The Spring Boot backend owns authentication, authorization, validation, sync APIs, and all writes to PostgreSQL.
- The web app is online-first for MVP. It calls the Spring Boot REST API directly and never reads from the Android local database.
- The Android app is offline-first. It writes to a local Room database first, marks records as pending sync, and uploads them when internet is available.
- Android receives web-created or web-updated data during its next sync from the backend.
- Web users see Android-created or Android-updated data after Android has synced it to PostgreSQL.
- Each workspace has one MVP base currency, defaulting to GBP. Budgets, expenses, accounts, recurring payments, and dashboard totals use that currency.

## Project Structure

```text
backend/        Spring Boot REST API
frontend/       React web app starter
docs/           Architecture, API design, and implementation plan
.env.example    Environment variables for local/dev deployment
```

## Quick Start

1. Copy `.env.example` to `.env` and fill in local values.
2. Create a PostgreSQL database matching `DB_NAME`, or run `docker compose up -d db`.
3. Run the backend from `backend/`.
4. Run the frontend from `frontend/`.

No real credentials are committed. Use environment variables for secrets.

## Environment Files

Create the backend `.env` file in the project root:

```text
/Volumes/Data/Rintu/Projects/Android/.env
```

Spring Boot imports both `../.env` and `.env`, so it works when the backend is run
from `backend/` or from the project root. In IntelliJ, set the backend run
configuration working directory to:

```text
/Volumes/Data/Rintu/Projects/Android/backend
```

The React frontend uses Vite. If the frontend needs local variables, create a
separate `frontend/.env` file with `VITE_` variables, or pass them through your
deployment environment.

## Verification

```bash
cd backend && mvn test
cd frontend && npm install && npm run build
```
