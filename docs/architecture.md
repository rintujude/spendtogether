# Architecture

## Principle

Cloud PostgreSQL is the shared source of truth after sync.

The Android app may temporarily have newer unsynced data in its local Room database,
but once sync succeeds, PostgreSQL is the canonical shared state for both Android
and web.

Each workspace has one base currency for the MVP. Budgets, expenses, payment
sources/accounts, recurring payments, and dashboard totals are recorded and
displayed in that workspace currency. No live exchange-rate conversion is
implemented yet; the schema remains open for multi-currency accounts later.

## Components

### Spring Boot Backend

- Provides REST APIs for auth, workspace membership, payment sources, categories,
  budgets, expenses, dashboards, and future recurring payments.
- Validates all writes before saving to PostgreSQL.
- Enforces workspace authorization so only active members can access shared data.
- Issues and verifies JWT tokens.
- Owns sync endpoints for Android.

### PostgreSQL

- Stores the canonical cloud copy of users, workspaces, categories, budgets,
  payment sources, expenses, and future recurring payments.
- Stores `workspaces.currency_code` as `VARCHAR(3)` with default `GBP`.
- Is read by the backend only, not directly by web or Android clients.
- Becomes the shared source of truth after each successful Android sync.

### React Web App

- Online-first for MVP.
- Calls the Spring Boot API directly.
- Saves data through the backend to cloud PostgreSQL.
- Does not use, read, or depend on Android Room.
- Shows Android-created changes only after those changes have synced from Android
  to the backend.

### Android App

- Offline-first.
- Saves all creates and updates first to a local Room database.
- Marks local records as pending sync until uploaded successfully.
- Syncs with the Spring Boot backend when internet is available.
- Downloads backend changes created by web or other workspace members during the next
  sync.

## Data Flow

### Web Creates Or Updates Data

1. User creates or updates data in the React web app.
2. Web app sends the request to Spring Boot.
3. Spring Boot validates authorization and payload.
4. Spring Boot writes the change to PostgreSQL.
5. Android receives the change during its next pull sync.

### Android Creates Or Updates Data

1. User creates or updates data in the Android app.
2. Android writes the change to Room immediately.
3. Android marks the change as pending sync.
4. When online, Android uploads pending changes to Spring Boot.
5. Spring Boot validates and writes accepted changes to PostgreSQL.
6. Android marks the local changes as synced.
7. Web app sees the changes the next time it fetches from the backend.

## Sync Model For Android

Each syncable table should include:

- `id`: stable UUID used locally and in the backend.
- `created_at`: creation timestamp.
- `updated_at`: last successful update timestamp.
- `deleted_at`: nullable soft-delete timestamp for sync-safe deletion.
- `version`: integer or timestamp used for conflict detection.
- `sync_status`: local-only Android field such as `SYNCED`, `PENDING_CREATE`,
  `PENDING_UPDATE`, `PENDING_DELETE`, or `FAILED`.
- `last_synced_at`: local-only Android timestamp for diagnostics and retry logic.

Recommended sync endpoints:

- `GET /api/workspaces/{workspaceId}/sync/changes?since=<cursor>`
- `POST /api/workspaces/{workspaceId}/sync/push`

## Conflict Strategy For MVP

- Prefer simple last-write-wins using `updated_at` or `version`.
- Keep an audit trail later if workspace members often edit the same records.
- For expenses, conflicts should be rare because most records are append-only.
- For budget limits and categories, show a warning in Android if a local pending
  edit loses to a newer cloud version.

## Important Boundaries

- The web app must not talk to Room.
- Android must not write directly to PostgreSQL.
- All cloud writes go through Spring Boot.
- PostgreSQL is shared truth only after Android sync succeeds.
- Unsynced Android data is visible locally on Android but not yet visible on web.
