# Implementation Plan

## Phase 1: Foundation

1. Create Spring Boot backend with PostgreSQL, Flyway, JPA, validation, and Spring Security.
2. Add React frontend with environment-based API URL.
3. Configure Linux VM deployment shape with environment variables.
4. Add CI later for backend tests, frontend build, and migration checks.
5. Use cloud PostgreSQL as the shared source of truth after successful sync.

## Phase 2: Authentication

1. Implement registration and login.
2. Store only BCrypt password hashes.
3. Issue JWT access tokens.
4. Add JWT request filter to authenticate protected endpoints.
5. Add current-user helper so services can enforce workspace membership.

## Phase 3: Workspace Membership

1. Create workspace after first user registration or through a setup screen.
2. Add owner, contributor, and viewer roles.
3. Add invitation flow for workspace members.
4. Enforce that every workspace resource can only be accessed by active members.
5. Store one base `currency_code` per workspace for MVP, defaulting to `GBP`.
6. Keep the later model open for multi-currency accounts without exchange conversion in MVP.

## Phase 4: Budget Setup

1. CRUD payment sources such as current account, credit card, and cash.
2. CRUD categories such as food, online shopping, travel, groceries, and bills.
3. Add monthly budget limits per category.
4. Add duplicate-name validation inside each workspace.

## Phase 5: Expenses

1. Add manual expense entry.
2. Include amount, date, category, payment source, description, and added-by user.
3. Add list filters by month, category, source, and user.
4. Add edit/delete with audit fields before production use.

## Phase 6: Dashboard

1. Calculate total budget, total spent, and remaining amount.
2. Show category-wise spending against monthly limits.
3. Show account-wise spending.
4. Add warning states for categories near or over budget.

## Phase 7: Loans, Direct Debits, And Reminders

1. Add recurring payment table with payment name, source, amount, due day, category, and active status.
2. Generate monthly payment occurrences.
3. Track paid/unpaid status per month.
4. Add reminders through email, push notification, or scheduled in-app reminders.

## Phase 8: Mobile

1. Build the Android app as offline-first.
2. Store all Android data first in a local Room database.
3. Add local sync metadata such as `sync_status`, `last_synced_at`, `version`, and soft-delete fields.
4. Upload pending Android creates and updates to the Spring Boot backend when internet is available.
5. Pull backend changes into Room so web-created data appears in Android after the next sync.
6. Build React Native screens for login, dashboard, expense entry, and direct debit checklist.
7. Add push notification integration for reminders.

## Phase 9: Sync API

1. Add `updated_at`, `deleted_at`, and `version` fields to syncable backend tables.
2. Add a pull endpoint for Android changes since a sync cursor.
3. Add a push endpoint for Android pending local changes.
4. Make sync idempotent so Android can safely retry after network failures.
5. Start with last-write-wins conflict handling for MVP.
6. Add conflict warnings later for shared records such as category budgets.

## Deployment Notes

- Use PostgreSQL on the VM or a managed database.
- Run backend as a systemd service or Docker container.
- Serve React static build with Nginx.
- Put TLS in front with Nginx and Certbot.
- Keep `.env` outside source control.
- Rotate `JWT_SECRET` if it is ever exposed.

## Client Data Ownership

- Web: online-first, talks directly to Spring Boot, stores shared data in PostgreSQL through the backend.
- Android: offline-first, writes to Room first, then syncs to Spring Boot.
- Backend: only server allowed to write PostgreSQL.
- PostgreSQL: canonical shared state after sync.
