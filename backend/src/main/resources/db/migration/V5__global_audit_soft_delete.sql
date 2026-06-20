ALTER TABLE users
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS updated_by UUID,
    ADD COLUMN IF NOT EXISTS deleted_by UUID,
    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE family_workspaces
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS updated_by UUID,
    ADD COLUMN IF NOT EXISTS deleted_by UUID;

ALTER TABLE family_members
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS updated_by UUID,
    ADD COLUMN IF NOT EXISTS deleted_by UUID,
    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE payment_sources
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS updated_by UUID,
    ADD COLUMN IF NOT EXISTS deleted_by UUID;

ALTER TABLE budget_categories
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS updated_by UUID,
    ADD COLUMN IF NOT EXISTS deleted_by UUID;

ALTER TABLE monthly_budgets
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS updated_by UUID,
    ADD COLUMN IF NOT EXISTS deleted_by UUID;

ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS updated_by UUID,
    ADD COLUMN IF NOT EXISTS deleted_by UUID;

ALTER TABLE workspace_monthly_total_budgets
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS updated_by UUID,
    ADD COLUMN IF NOT EXISTS deleted_by UUID,
    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

UPDATE users
SET updated_at = created_at
WHERE updated_at IS NULL;

UPDATE family_members
SET created_at = joined_at,
    updated_at = joined_at
WHERE created_at IS NULL OR updated_at IS NULL;

UPDATE family_workspaces
SET created_by = created_by_user_id
WHERE created_by IS NULL;

UPDATE workspace_monthly_total_budgets
SET updated_by = updated_by_user_id
WHERE updated_by IS NULL;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE payment_sources DROP CONSTRAINT IF EXISTS uk_payment_sources_workspace_name;
ALTER TABLE budget_categories DROP CONSTRAINT IF EXISTS uk_budget_categories_workspace_name;
ALTER TABLE monthly_budgets DROP CONSTRAINT IF EXISTS uk_monthly_budgets_workspace_category_month;
ALTER TABLE workspace_monthly_total_budgets DROP CONSTRAINT IF EXISTS uk_workspace_monthly_total_budgets_month;

CREATE UNIQUE INDEX IF NOT EXISTS uk_users_email_active
    ON users (email)
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_payment_sources_workspace_name_active
    ON payment_sources (workspace_id, lower(name))
    WHERE deleted_at IS NULL AND active = true;

CREATE UNIQUE INDEX IF NOT EXISTS uk_budget_categories_workspace_name_active
    ON budget_categories (workspace_id, lower(name))
    WHERE deleted_at IS NULL AND active = true;

CREATE UNIQUE INDEX IF NOT EXISTS uk_monthly_budgets_workspace_category_month_active
    ON monthly_budgets (workspace_id, category_id, budget_year, budget_month)
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_workspace_monthly_total_budgets_month_active
    ON workspace_monthly_total_budgets (workspace_id, budget_year, budget_month)
    WHERE deleted_at IS NULL;
