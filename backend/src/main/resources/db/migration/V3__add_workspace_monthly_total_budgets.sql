CREATE TABLE workspace_monthly_total_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES family_workspaces(id) ON DELETE CASCADE,
    budget_year INTEGER NOT NULL CHECK (budget_year >= 2000),
    budget_month INTEGER NOT NULL CHECK (budget_month BETWEEN 1 AND 12),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    updated_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_workspace_monthly_total_budgets_month UNIQUE (workspace_id, budget_year, budget_month)
);
