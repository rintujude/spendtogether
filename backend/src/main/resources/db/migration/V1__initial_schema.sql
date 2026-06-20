CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(160) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE family_workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(160) NOT NULL,
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES family_workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL CHECK (role IN ('OWNER', 'MEMBER')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_family_members_workspace_user UNIQUE (workspace_id, user_id)
);

CREATE TABLE payment_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES family_workspaces(id) ON DELETE CASCADE,
    name VARCHAR(160) NOT NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('CURRENT_ACCOUNT', 'CREDIT_CARD', 'CASH', 'SAVINGS', 'OTHER')),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uk_payment_sources_workspace_name UNIQUE (workspace_id, name)
);

CREATE TABLE budget_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES family_workspaces(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uk_budget_categories_workspace_name UNIQUE (workspace_id, name)
);

CREATE TABLE monthly_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES family_workspaces(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES budget_categories(id),
    budget_year INTEGER NOT NULL CHECK (budget_year >= 2000),
    budget_month INTEGER NOT NULL CHECK (budget_month BETWEEN 1 AND 12),
    limit_amount NUMERIC(12, 2) NOT NULL CHECK (limit_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uk_monthly_budgets_workspace_category_month UNIQUE (
        workspace_id,
        category_id,
        budget_year,
        budget_month
    )
);

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES family_workspaces(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES budget_categories(id),
    payment_source_id UUID NOT NULL REFERENCES payment_sources(id),
    added_by_user_id UUID NOT NULL REFERENCES users(id),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_expenses_workspace_date ON expenses(workspace_id, expense_date);
CREATE INDEX idx_expenses_workspace_category ON expenses(workspace_id, category_id);
CREATE INDEX idx_expenses_workspace_payment_source ON expenses(workspace_id, payment_source_id);
