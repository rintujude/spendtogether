# REST API Design

Base URL: `/api`

All protected endpoints require:

```http
Authorization: Bearer <jwt>
```

## Client Architecture

- Web is online-first for MVP and calls these REST APIs directly.
- Android is offline-first and stores data in Room before syncing with the backend.
- Web never reads from Android Room.
- Android never writes directly to PostgreSQL.
- PostgreSQL is the shared source of truth after Android sync succeeds.

## Authentication

### Register

`POST /auth/register`

```json
{
  "fullName": "Rintu Jude",
  "email": "user@example.com",
  "password": "use-a-real-password-locally"
}
```

Returns:

```json
{
  "token": "jwt",
  "user": {
    "id": "uuid",
    "fullName": "Rintu Jude",
    "email": "user@example.com"
  }
}
```

### Login

`POST /auth/login`

```json
{
  "email": "user@example.com",
  "password": "use-a-real-password-locally"
}
```

## Workspaces

### List Workspaces

`GET /workspaces`

Returns the workspaces the authenticated user belongs to:

```json
[
  {
    "id": "uuid",
    "name": "Trip Budget"
  }
]
```

### Create Workspace

`POST /workspaces`

```json
{
  "name": "Trip Budget",
  "currencyCode": "GBP"
}
```

Returns:

```json
{
  "id": "uuid",
  "name": "Trip Budget",
  "currencyCode": "GBP"
}
```

`currencyCode` defaults to `GBP` when omitted. Supported MVP currencies are
`GBP`, `INR`, `USD`, `EUR`, `AED`, `CAD`, and `AUD`. The MVP does not perform
live exchange-rate conversion; every workspace has one base currency.

### Update Current Workspace

`PUT /workspaces/current`

Headers:

```http
Authorization: Bearer <jwt>
X-Workspace-Id: <workspace uuid>
```

Only a workspace `OWNER` can update workspace settings.

```json
{
  "name": "Shared House Budget",
  "currencyCode": "GBP"
}
```

Returns:

```json
{
  "id": "uuid",
  "name": "Shared House Budget",
  "currencyCode": "GBP",
  "updatedAt": "2026-06-16T00:00:00Z"
}
```

### Workspace Members

Roles are `OWNER`, `CONTRIBUTOR`, and `VIEWER`. Member statuses are `ACTIVE`,
`PENDING`, `REMOVED`, and `LEFT`.

`GET /workspaces/{workspaceId}/members`

Returns active members and pending invitations:

```json
{
  "members": [
    {
      "id": "uuid",
      "userId": "uuid",
      "fullName": "Rintu Jude",
      "email": "user@example.com",
      "role": "OWNER",
      "status": "ACTIVE"
    }
  ],
  "pendingInvitations": [
    {
      "id": "uuid",
      "email": "friend@example.com",
      "role": "CONTRIBUTOR",
      "status": "PENDING",
      "message": "Join this workspace",
      "invitedBy": "Rintu Jude",
      "createdAt": "2026-06-16T00:00:00Z"
    }
  ]
}
```

Only `OWNER` can invite members.

`POST /workspaces/{workspaceId}/invitations`

```json
{
  "email": "friend@example.com",
  "role": "CONTRIBUTOR",
  "message": "Join this workspace"
}
```

Only `OWNER` can change roles or remove members:

`PATCH /workspaces/{workspaceId}/members/{memberId}/role`

```json
{
  "role": "VIEWER"
}
```

`PATCH /workspaces/{workspaceId}/members/{memberId}/remove`

## Payment Sources

`GET /workspaces/{workspaceId}/payment-sources`

`POST /workspaces/{workspaceId}/payment-sources`

```json
{
  "name": "Barclays current account",
  "type": "CURRENT_ACCOUNT"
}
```

Types: `CURRENT_ACCOUNT`, `CREDIT_CARD`, `CASH`, `SAVINGS`, `OTHER`.

Additional supported source types for workspace settings:
`BANK_ACCOUNT`, `DEBIT_CARD`, and `UPI_WALLET`.

`PUT /workspaces/{workspaceId}/payment-sources/{sourceId}`

```json
{
  "name": "Barclays credit card",
  "type": "CREDIT_CARD"
}
```

`PATCH /workspaces/{workspaceId}/payment-sources/{sourceId}/deactivate`

Payment sources are deactivated rather than hard-deleted, preserving existing
expense history.

## Budget Categories

`GET /workspaces/{workspaceId}/categories`

`POST /workspaces/{workspaceId}/categories`

```json
{
  "name": "Groceries",
  "categoryType": "EXPENSE",
  "monthlyBudgetAmount": 450.00
}
```

Category types: `INCOME`, `EXPENSE`.

Creating a category also creates the current month category budget for the same
workspace. Category budget creation is handled from the category management
flow, not from a separate budget form.

`PUT /workspaces/{workspaceId}/categories/{categoryId}`

```json
{
  "name": "Salary",
  "categoryType": "INCOME",
  "monthlyBudgetAmount": 0.00
}
```

Updating a category also updates the current month category budget row. The
backend updates the existing row when present and creates it only when missing.

`PATCH /workspaces/{workspaceId}/categories/{categoryId}/deactivate`

Categories are deactivated rather than hard-deleted, preserving existing
transaction history.

## Monthly Budgets

`GET /workspaces/{workspaceId}/budgets?year=2026&month=6`

`POST /workspaces/{workspaceId}/budgets`

```json
{
  "categoryId": "uuid",
  "budgetYear": 2026,
  "budgetMonth": 6,
  "limitAmount": 450.00
}
```

`PUT /workspaces/{workspaceId}/budgets/{budgetId}`

```json
{
  "categoryId": "uuid",
  "budgetYear": 2026,
  "budgetMonth": 6,
  "limitAmount": 500.00
}
```

`PATCH /workspaces/{workspaceId}/budgets/{budgetId}/deactivate`

Budgets are soft-deactivated with `deleted_at` instead of being hard-deleted.

### Update Current Month Total Budget

`PUT /budgets/current-month/total`

Headers:

```http
Authorization: Bearer <jwt>
X-Workspace-Id: <workspace uuid>
```

Creates the current month total budget row if missing, otherwise updates the
existing row. The user must belong to the selected workspace.

```json
{
  "amount": 2500.00
}
```

Returns:

```json
{
  "month": 6,
  "year": 2026,
  "totalBudget": 2500.00,
  "updatedAt": "2026-06-16T00:00:00Z"
}
```

## Expenses

`GET /workspaces/{workspaceId}/expenses?from=2026-06-01&to=2026-06-30`

`POST /workspaces/{workspaceId}/expenses`

```json
{
  "categoryId": "uuid",
  "paymentSourceId": "uuid",
  "amount": 35.80,
  "expenseDate": "2026-06-15",
  "description": "Weekly grocery shop"
}
```

## Dashboard

`GET /workspaces/{workspaceId}/dashboard?year=2026&month=6`

Returns:

```json
{
  "month": 6,
  "year": 2026,
  "currencyCode": "GBP",
  "currencySymbol": "£",
  "totalBudget": 2400.00,
  "totalSpent": 1280.50,
  "remainingAmount": 1119.50,
  "categoryWiseSpending": {
    "Groceries": 420.00,
    "Bills": 360.50
  },
  "accountWiseSpending": {
    "Barclays current account": 820.50,
    "Barclays credit card": 390.00
  },
  "categories": [
    {
      "categoryId": "uuid",
      "categoryName": "Groceries",
      "budgetAmount": 450.00,
      "spentAmount": 420.00,
      "remainingAmount": 30.00,
      "percentageUsed": 93.33,
      "overBudget": false
    }
  ]
}
```

## Workspace Realtime Events

Web clients connect to the STOMP WebSocket endpoint:

`/ws`

Clients pass the JWT in the STOMP `CONNECT` headers:

```http
Authorization: Bearer <jwt>
```

After connecting, clients subscribe to the current workspace topic:

`/topic/workspaces/{workspaceId}`

Only active workspace members can subscribe to that workspace topic. Events send
metadata only; clients refetch secured REST APIs for the latest source-of-truth
data from PostgreSQL.

Example event:

```json
{
  "workspaceId": "uuid",
  "eventType": "EXPENSE_CREATED",
  "entityType": "EXPENSE",
  "entityId": "uuid",
  "changedBy": "uuid",
  "occurredAt": "2026-06-16T21:30:00Z"
}
```

Supported event types include:
`EXPENSE_CREATED`, `EXPENSE_UPDATED`, `EXPENSE_DELETED`,
`CATEGORY_CREATED`, `CATEGORY_UPDATED`, `CATEGORY_DELETED`,
`CATEGORY_BUDGET_UPDATED`, `ACCOUNT_CREATED`, `ACCOUNT_UPDATED`,
`ACCOUNT_DELETED`, `MONTHLY_BUDGET_UPDATED`, and `WORKSPACE_UPDATED`.

## Later MVP+ Endpoints

- `GET /workspaces/{workspaceId}/sync/changes?since=2026-06-16T00:00:00Z`
- `POST /workspaces/{workspaceId}/sync/push`
- `POST /workspaces/{workspaceId}/recurring-payments`
- `PATCH /recurring-payments/{id}/mark-paid`
- `GET /workspaces/{workspaceId}/payment-reminders?month=2026-06`
- `POST /workspaces/{workspaceId}/invitations`
- `POST /invitations/{token}/accept`
